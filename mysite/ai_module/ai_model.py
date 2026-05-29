import os
import re
import pandas as pd
import nltk
import requests
from bs4 import BeautifulSoup
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from data_module.models import ScrapedPage
from django.db.models import Sum, Avg,Max
from data_module.models import GSCMetrics, GAMetrics,GAEvent
from datetime import timedelta


# =========================
# Chargement des datasets
# =========================

def get_period_start_date(website_id=None, period="all"):
    if period == "all":
        return None

    ga_query = GAMetrics.objects.all()
    gsc_query = GSCMetrics.objects.all()

    if website_id:
        ga_query = ga_query.filter(website_id=website_id)
        gsc_query = gsc_query.filter(website_id=website_id)

    last_ga_date = ga_query.aggregate(last_date=Max("date"))["last_date"]
    last_gsc_date = gsc_query.aggregate(last_date=Max("date"))["last_date"]

    available_dates = [d for d in [last_ga_date, last_gsc_date] if d]

    if not available_dates:
        return None

    last_available_date = max(available_dates)

    if period == "day":
        return last_available_date

    if period == "week":
        return last_available_date - timedelta(days=7)

    if period == "month":
        return last_available_date - timedelta(days=30)

    return None


def load_gsc_dataset_from_db(website_id=None,period="all"):
    import pandas as pd
    from data_module.models import GSCMetrics, Website

    query = GSCMetrics.objects.all()

    if website_id:
        query = query.filter(website_id=website_id)
        start_date = get_period_start_date(website_id, period)
        if start_date:
            if period == "day":
                query = query.filter(date=start_date)
            else:
                query = query.filter(date__gte=start_date)

    rows = list(
        query.values(
            "website_id",
            "date",
            "clicks",
            "impressions",
            "ctr",
            "position",
        )
    )

    df = pd.DataFrame(rows)

    if not df.empty:
        site_map = {w.id: w.name for w in Website.objects.all()}
        df["entity"] = df["website_id"].map(site_map)
        df["entity"] = df["entity"].fillna("Site inconnu")

    return df

def load_ga_dataset_from_db(website_id=None,period="all"):
    import pandas as pd
    from data_module.models import GAMetrics, Website

    query = GAMetrics.objects.all()

    if website_id:
        query = query.filter(website_id=website_id)
        start_date = get_period_start_date(website_id, period)
        if start_date:
            if period == "day":
                query = query.filter(date=start_date)
            else:
                query = query.filter(date__gte=start_date)

    rows = list(
        query.values(
            "website_id",
            "date",
            "active_users",
            "sessions",
            "page_views",
        )
    )

    df = pd.DataFrame(rows)

    if not df.empty:
        site_map = {w.id: w.name for w in Website.objects.all()}
        df["entity"] = df["website_id"].map(site_map)
        df["entity"] = df["entity"].fillna("Site inconnu")

    return df

def load_pages_content_dataset(website_id=None):

    if website_id:
        pages = ScrapedPage.objects.filter(website_id=website_id)
    else:
        pages = ScrapedPage.objects.all()

    data = []

    for page in pages:
        url = page.url

        try:
            response = requests.get(url, timeout=10)
            soup = BeautifulSoup(response.text, "html.parser")

            title = soup.title.string if soup.title else ""

            meta = ""
            meta_tag = soup.find("meta", attrs={"name": "description"})
            if meta_tag:
                meta = meta_tag.get("content", "")

            text = soup.get_text(separator=" ", strip=True)

            data.append({
                "page": url,
                "title": title,
                "meta_description": meta,
                "content": text
            })

        except Exception as e:
            print("Erreur lors de l'analyse de :", url, e)

    return pd.DataFrame(data)
# =========================
# Analyse KPI
# =========================
def analyse_data(website_id=None, period="all"):
    gsc_df = load_gsc_dataset_from_db(website_id, period)
    ga_df = load_ga_dataset_from_db(website_id, period)

    seo = {
        "total_clicks": 0,
        "total_impressions": 0,
        "avg_position": 0,
        "avg_ctr": 0
    }

    traffic = {
        "total_active_users": 0,
        "total_sessions": 0,
        "total_page_views": 0
    }

    if not gsc_df.empty:
        seo["total_clicks"] = int(gsc_df["clicks"].sum())
        seo["total_impressions"] = int(gsc_df["impressions"].sum())
        seo["avg_position"] = round(float(gsc_df["position"].mean()), 2)
        seo["avg_ctr"] = round(float(gsc_df["ctr"].mean()), 4)

    if not ga_df.empty:
        traffic["total_active_users"] = int(ga_df["active_users"].sum())
        traffic["total_sessions"] = int(ga_df["sessions"].sum())
        traffic["total_page_views"] = int(ga_df["page_views"].sum())

    return {
        "seo": seo,
        "traffic": traffic
    }


def analyse_events(website_id=None, period="all"):
    query = GAEvent.objects.all()

    if website_id:
        query = query.filter(website_id=website_id)

    start_date = get_period_start_date(website_id, period)

    if start_date:
        if period == "day":
            query = query.filter(date=start_date)
        else:
            query = query.filter(date__gte=start_date)

    total_events = query.aggregate(total=Sum("event_count"))["total"] or 0
    total_users = query.aggregate(total=Sum("users"))["total"] or 0

    top_events = list(
        query.values("event_name")
        .annotate(total_events=Sum("event_count"))
        .order_by("-total_events")[:5]
    )

    return {
        "total_events": int(total_events),
        "total_event_users": int(total_users),
        "top_events": top_events,
    }



# =========================
# Recommandations SEO
# =========================
def generate_recommendations(website_id=None,period="all"):
    gsc_df = load_gsc_dataset_from_db(website_id, period)
    ga_df = load_ga_dataset_from_db(website_id, period)

    if gsc_df.empty and ga_df.empty:
        return ["Aucune donnée disponible pour générer des recommandations."]

    recommendations = []

    gsc_grouped = pd.DataFrame()
    ga_grouped = pd.DataFrame()

    if not gsc_df.empty:
        gsc_grouped = gsc_df.groupby("entity").agg(
            clicks=("clicks", "sum"),
            impressions=("impressions", "sum"),
            avg_position=("position", "mean"),
        ).reset_index()

        gsc_grouped["ctr_calc"] = gsc_grouped.apply(
            lambda row: row["clicks"] / row["impressions"] if row["impressions"] > 0 else 0,
            axis=1
        )

    if not ga_df.empty:
        ga_grouped = ga_df.groupby("entity").agg(
            active_users=("active_users", "sum"),
            sessions=("sessions", "sum"),
            page_views=("page_views", "sum"),
        ).reset_index()

    if not gsc_grouped.empty and not ga_grouped.empty:
        combined = pd.merge(gsc_grouped, ga_grouped, on="entity", how="outer").fillna(0)
    elif not gsc_grouped.empty:
        combined = gsc_grouped.fillna(0)
    else:
        combined = ga_grouped.fillna(0)

    for _, row in combined.iterrows():
        entity = row["entity"]

        clicks = row.get("clicks", 0)
        impressions = row.get("impressions", 0)
        avg_position = row.get("avg_position", 0)
        ctr = row.get("ctr_calc", 0)

        active_users = row.get("active_users", 0)
        sessions = row.get("sessions", 0)
        page_views = row.get("page_views", 0)

        if impressions >= 2000 and ctr < 0.03:
            recommendations.append(
                f"{entity} : impressions élevées ({int(impressions)}) mais CTR faible ({ctr:.2%}). "
                f"Améliorer le title et la meta description."
            )

        if 8 <= avg_position <= 15:
            recommendations.append(
                f"{entity} : position moyenne {avg_position:.1f}. "
                f"Optimiser le contenu pour viser le Top 5."
            )

        if avg_position > 15 and impressions > 0:
            recommendations.append(
                f"{entity} : position faible ({avg_position:.1f}). "
                f"Renforcer le contenu, le maillage interne et les backlinks."
            )

        if clicks < 20 and impressions > 0:
            recommendations.append(
                f"{entity} : très peu de clics ({int(clicks)}). "
                f"Travailler les snippets Google et le contenu."
            )

        if sessions < 10 and active_users < 10:
            recommendations.append(
                f"{entity} : trafic très faible côté Google Analytics "
                f"({int(active_users)} utilisateurs, {int(sessions)} sessions). "
                f"Renforcer la promotion du site et améliorer la visibilité."
            )

        if page_views > 0 and sessions > 0 and page_views / sessions < 1.5:
            recommendations.append(
                f"{entity} : faible profondeur de navigation "
                f"({page_views / sessions:.2f} pages vues par session). "
                f"Ajouter des liens internes et améliorer l'expérience utilisateur."
            )

        if clicks == 0 and sessions > 0:
            recommendations.append(
                f"{entity} : le site reçoit des sessions ({int(sessions)}) mais aucun clic SEO. "
                f"Le trafic semble venir d'autres sources ; renforcer l'indexation et l'optimisation Search Console."
            )

    return list(dict.fromkeys(recommendations))

# =========================
# Prévision simplifiée
# =========================
def predict_traffic(days_ahead=1, website_id=None):
    gsc_df = load_gsc_dataset_from_db(website_id)
    ga_df = load_ga_dataset_from_db(website_id)

    if gsc_df.empty and ga_df.empty:
        return []

    predictions = []

    gsc_grouped = pd.DataFrame()
    ga_grouped = pd.DataFrame()

    if not gsc_df.empty:
        gsc_grouped = gsc_df.groupby("entity").agg(
            avg_clicks=("clicks", "mean"),
            avg_impressions=("impressions", "mean"),
        ).reset_index()

    if not ga_df.empty:
        ga_grouped = ga_df.groupby("entity").agg(
            avg_active_users=("active_users", "mean"),
            avg_sessions=("sessions", "mean"),
            avg_page_views=("page_views", "mean"),
        ).reset_index()

    if not gsc_grouped.empty and not ga_grouped.empty:
        combined = pd.merge(gsc_grouped, ga_grouped, on="entity", how="outer").fillna(0)
    elif not gsc_grouped.empty:
        combined = gsc_grouped.fillna(0)
    else:
        combined = ga_grouped.fillna(0)

    for _, row in combined.iterrows():
        predictions.append({
            "page": row["entity"],
            "predicted_clicks": int(row.get("avg_clicks", 0) * days_ahead),
            "predicted_impressions": int(row.get("avg_impressions", 0) * days_ahead),
            "predicted_active_users": int(row.get("avg_active_users", 0) * days_ahead),
            "predicted_sessions": int(row.get("avg_sessions", 0) * days_ahead),
            "predicted_page_views": int(row.get("avg_page_views", 0) * days_ahead),
        })

    return predictions
# =========================
# NLP
# =========================
def clean_text(text: str) -> str:
    text = str(text).lower()
    text = re.sub(r"[^a-zàâçéèêëîïôùûüÿñæœ\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def nlp_analysis(website_id=None):
    df = load_pages_content_dataset(website_id)

    if df.empty:
        return []

    df["clean_content"] = df["content"].apply(clean_text)

    nltk.download("stopwords", quiet=True)
    french_stopwords = stopwords.words("french")

    vectorizer = TfidfVectorizer(stop_words=french_stopwords, max_features=30)
    X = vectorizer.fit_transform(df["clean_content"])
    vocab = vectorizer.get_feature_names_out()

    results = []

    for i, row in df.iterrows():
        page = row["page"]
        title = row["title"]
        meta = row["meta_description"]
        content = row["content"]

        scores = X[i].toarray()[0]
        top_indices = scores.argsort()[-5:][::-1]
        top_keywords = [vocab[idx] for idx in top_indices if scores[idx] > 0]

        issues = []
        recommendations = []

        score = 100

        # Meta description
        if not meta:
            issues.append("Meta description absente")
            recommendations.append("Ajouter une meta description entre 150 et 160 caractères")
            score -= 20
        elif len(meta) < 80:
            issues.append("Meta description trop courte")
            recommendations.append("Allonger la meta description entre 150 et 160 caractères")
            score -= 10
        elif len(meta) > 170:
            issues.append("Meta description trop longue")
            recommendations.append("Raccourcir la meta description")
            score -= 5

        # Title
        if not title:
            issues.append("Title absent")
            recommendations.append("Ajouter un title descriptif entre 50 et 60 caractères")
            score -= 20
        elif len(title) < 25:
            issues.append("Title trop court")
            recommendations.append("Rendre le title plus descriptif entre 50 et 60 caractères")
            score -= 10
        elif len(title) > 70:
            issues.append("Title trop long")
            recommendations.append("Raccourcir le title entre 50 et 60 caractères")
            score -= 10

        # Contenu
        word_count = len(content.split())
        if word_count < 120:
            issues.append(f"Contenu très faible ({word_count} mots)")
            recommendations.append("Ajouter davantage de contenu, idéalement au moins 300 mots")
            score -= 25
        elif word_count < 300:
            issues.append(f"Contenu faible ({word_count} mots)")
            recommendations.append("Enrichir le contenu pour dépasser 300 mots")
            score -= 10

        # Mot-clé principal
        if top_keywords:
            main_kw = top_keywords[0]

            if main_kw.lower() not in title.lower():
                issues.append(f"Mot-clé principal '{main_kw}' absent du title")
                recommendations.append(f"Ajouter le mot-clé '{main_kw}' dans le title")
                score -= 10

            if meta and main_kw.lower() not in meta.lower():
                issues.append(f"Mot-clé principal '{main_kw}' absent de la meta description")
                recommendations.append(f"Ajouter le mot-clé '{main_kw}' dans la meta description")
                score -= 5
        else:
            issues.append("Aucun mot-clé significatif détecté")
            recommendations.append("Renforcer le contenu avec un vocabulaire métier plus précis")
            score -= 10

        score = max(score, 0)
        if score >= 85:
            status = "Excellent"
        elif score >= 70:
            status = "Bon"
        elif score >= 50:
            status = "Moyen"
        else:
            status = "Faible"
        interpretation = ""

        if status == "Faible":
            interpretation = "La page nécessite des améliorations importantes en SEO."
        elif status == "Moyen":
            interpretation = "La page est correcte mais peut être optimisée."
        elif status == "Bon":
            interpretation = "La page est bien optimisée avec quelques améliorations possibles."
        else:
            interpretation = "La page est très bien optimisée."

        results.append(
            {
                "page": page,
                "top_keywords": top_keywords,
                "issues": issues,
                "recommendations": recommendations,
                "seo_score": score,
                "status": status,
                "interpretation":interpretation,
            }
        )

    return results
def calculate_site_score():
    page_results = nlp_analysis()

    if not page_results:
        return {
            "site_score": 0,
            "status": "Aucune donnée",
            "interpretation": "Aucune page analysée"
        }

    scores = [item["seo_score"] for item in page_results if "seo_score" in item]

    if not scores:
        return {
            "site_score": 0,
            "status": "Aucune donnée",
            "interpretation": "Aucun score disponible"
        }

    avg_score = round(sum(scores) / len(scores), 2)

    if avg_score >= 85:
        status = "Excellent"
        interpretation = "Le site est très bien optimisé."
    elif avg_score >= 70:
        status = "Bon"
        interpretation = "Le site est bien optimisé avec quelques améliorations possibles."
    elif avg_score >= 50:
        status = "Moyen"
        interpretation = "Le site nécessite des optimisations SEO."
    else:
        status = "Faible"
        interpretation = "Le site est mal optimisé et nécessite des améliorations importantes."

    return {
        "site_score": avg_score,
        "status": status,
        "interpretation": interpretation
    }
def calculate_gsc_score(row):
    score = 100

    if row["ctr"] < 0.02:
        score -= 30

    if row["avg_position"] > 20:
        score -= 30
    elif row["avg_position"] > 10:
        score -= 15

    if row["impressions"] < 50:
        score -= 20

    return max(score, 0)
def calculate_ga_score(row):
    score = 100

    if row["sessions"] < 10:
        score -= 30

    if row["page_views"] < 10:
        score -= 20

    return max(score, 0)
def run_page_ai_analysis(website_id=None):
    page_kpis = generate_recommendations(website_id)  # ton existant
    nlp_results = nlp_analysis(website_id)           # ton existant

    final_results = []

    for nlp_item in nlp_results:
        page = nlp_item["page"]

        # score contenu
        content_score = nlp_item["seo_score"]

        # score GSC (simplifié car ton code actuel est par site)
        gsc_score = 100
        if "faible" in nlp_item["status"].lower():
            gsc_score -= 30

        # score GA (simplifié)
        ga_score = 100

        # score final
        final_score = round(
            (content_score * 0.6) +
            (gsc_score * 0.2) +
            (ga_score * 0.2), 2
        )

        final_results.append({
            "page": page,
            "content_score": content_score,
            "final_score": final_score,
            "status": nlp_item["status"],
            "recommendations": nlp_item["recommendations"]
        })

    return final_results
# =========================
# Nouvelles fonctions chatbot
# =========================

def get_anomalies(website_id=None):
    results = run_page_ai_analysis(website_id)

    anomalies = []

    for item in results:
        if item["final_score"] < 50:
            anomalies.append({
                "page": item["page"],
                "message": f"Score faible détecté ({item['final_score']})"
            })

    return anomalies


def get_weak_pages(website_id=None):
    results = run_page_ai_analysis(website_id)

    weak_pages = sorted(
        results,
        key=lambda x: x["final_score"]
    )[:5]

    return [
        {
            "page": item["page"],
            "score": item["final_score"]
        }
        for item in weak_pages
    ]


def get_scores():
    results = run_page_ai_analysis()

    return [
        {
            "page": item["page"],
            "performance_score": "-",
            "visibility_score": "-",
            "technical_score": item["content_score"]
        }
        for item in results
    ]


def get_page_detail(question,website_id=None):
    results = run_page_ai_analysis(website_id)

    page_found = None

    for item in results:
        if item["page"].lower() in question.lower():
            page_found = item
            break

    if not page_found:
        return []

    return [{
        "page": page_found["page"],
        "performance_score": "-",
        "visibility_score": "-",
        "technical_score": page_found["content_score"],
        "score": page_found["final_score"],
        "recommendations": page_found["recommendations"]
    }]
def detect_seo_issues(website_id):
    issues = []

    # =========================
    # 1. Analyse GSC (SEO)
    # =========================
    gsc_pages = (
        GSCMetrics.objects
        .filter(website_id=website_id)
        .values("page")
        .annotate(
            impressions=Sum("impressions"),
            clicks=Sum("clicks"),
            avg_position=Avg("position")
        )
    )

    for p in gsc_pages:
        # 🔴 Règle 1 : impressions élevées + 0 clic
        if p["impressions"] > 50 and p["clicks"] == 0:
            issues.append({
                "type": "SEO",
                "page": p["page"],
                "problem": "Beaucoup d’impressions mais aucun clic",
                "cause": "Title ou meta description non attractif"
            })

        # 🔴 Règle 2 : position faible
        if p["avg_position"] and p["avg_position"] > 20:
            issues.append({
                "type": "SEO",
                "page": p["page"],
                "problem": "Position moyenne faible",
                "cause": "Contenu non optimisé ou concurrence forte"
            })

    # =========================
    # 2. Analyse GA4 (UX)
    # =========================
    ga_pages = (
        GAMetrics.objects
        .filter(website_id=website_id)
        .values("page_path")
        .annotate(
            avg_engagement=Avg("engagement_rate"),
            avg_duration=Avg("average_session_duration")
        )
    )

    for g in ga_pages:
        # 🔴 Règle 3 : faible engagement
        if g["avg_engagement"] is not None and g["avg_duration"] is not None:
            if g["avg_engagement"] < 0.3 and g["avg_duration"] < 10:
                issues.append({
                    "type": "UX",
                    "page": g["page_path"],
                    "problem": "Faible engagement utilisateur",
                    "cause": "Contenu peu pertinent ou mauvaise UX"
                })

    return issues