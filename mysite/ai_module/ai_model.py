import os
import re
import pandas as pd
import nltk
import requests
from bs4 import BeautifulSoup
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer


# =========================
# Chargement des datasets
# =========================
def load_gsc_dataset_from_db():
    from data_module.models import GSCMetrics

    rows = list(
        GSCMetrics.objects.all().values(
            "website_id", "date", "clicks", "impressions", "ctr", "position"
        )
    )

    df = pd.DataFrame(rows)

    if not df.empty:
        df["entity"] = "website_" + df["website_id"].astype(str)

    return df


def load_ga_dataset_from_db():
    from data_module.models import GAMetrics

    rows = list(
        GAMetrics.objects.all().values(
            "website_id", "date", "active_users", "sessions", "page_views"
        )
    )

    df = pd.DataFrame(rows)

    if not df.empty:
        df["entity"] = "website_" + df["website_id"].astype(str)

    return df


def load_pages_content_dataset():

    pages = [
        "https://clever-taffy-6e70c6.netlify.app/",
        "https://clever-taffy-6e70c6.netlify.app/page2.html",
        "https://clever-taffy-6e70c6.netlify.app/page3.html",
        "https://clever-taffy-6e70c6.netlify.app/page4.html",
        "https://clever-taffy-6e70c6.netlify.app/page5.html",

        
    ]

    data = []

    for url in pages:

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
def analyse_data():
    gsc_df = load_gsc_dataset_from_db()
    ga_df = load_ga_dataset_from_db()

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


# =========================
# Recommandations SEO
# =========================
def generate_recommendations():
    gsc_df = load_gsc_dataset_from_db()
    ga_df = load_ga_dataset_from_db()

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
def predict_traffic(days_ahead=1):
    gsc_df = load_gsc_dataset_from_db()
    ga_df = load_ga_dataset_from_db()

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


def nlp_analysis():
    df = load_pages_content_dataset()

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
def run_page_ai_analysis():
    page_kpis = generate_recommendations()  # ton existant
    nlp_results = nlp_analysis()           # ton existant

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