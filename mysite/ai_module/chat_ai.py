import random
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from data_module.models import Website
from gemini_module.gemini_service import GeminiService
from gemini_module.prompt_builder import build_chatbot_prompt
from .rag_embeddings import retrieve_relevant_documents

from .ai_model import (
    analyse_data,
    predict_traffic,
    generate_recommendations,
    nlp_analysis,
    get_anomalies,
    get_weak_pages,
    get_scores,
    get_page_detail,
    load_gsc_dataset_from_db,   # ajouté pour intent gsc dédié
    load_ga_dataset_from_db,    # ajouté pour intent ga dédié
)


# ============================================================
# INTENT EXAMPLES
# ============================================================
INTENT_EXAMPLES = {
    "kpi": [
        "donne moi les kpi",
        "affiche les clicks impressions ctr position",
        "montre la performance du site",
        "statistiques du trafic",
        "résumé des indicateurs",
    ],
    "ga": [
        "analyse google analytics",
        "statistiques trafic",
        "sessions du site",
        "utilisateurs actifs",
        "pages vues",
        "taux d engagement",
    ],
    "gsc": [
        "analyse seo",
        "search console",
        "clicks impressions",
        "position google",
        "requêtes de recherche",
        "mots clés google",
    ],
    "scraping": [
        "analyse scraping",
        "analyse technique du site",
        "web scraping",
        "résultat du scraping",
        "problèmes techniques",
        "images sans alt",
        "h1 manquant",
        "temps de réponse",
        "contenu faible",
        "score technique",
        "analyse mon site",
        "analysez mon site",
        "analyser mon site",
        "fais une analyse du site",
        "donne moi une analyse du site",
        "analyse seo du site",
        "analyse complète du site",
        "diagnostic du site",
        "audit seo du site",
    ],
    "prediction": [
        "fais une prévision du trafic",
        "prédis le trafic",
        "estime le trafic demain",
        "traffic futur",
        "forecast traffic",
        "combien de clicks demain",
    ],
    "recommendations": [
        "donne moi des recommandations seo",
        "comment améliorer le ctr",
        "conseils seo",
        "que dois-je optimiser",
        "amélioration du site",
        "actions à faire",
    ],
    "nlp": [
        "analyse les mots clés",
        "keywords principaux",
        "problèmes dans le title",
        "meta description",
        "analyse contenu",
        "seo on page",
    ],
    "anomalies": [
        "quelles sont les anomalies",
        "affiche les anomalies",
        "pages anormales",
        "problèmes détectés",
        "anomalies seo",
        "pages à risque",
    ],
    "traffic_diagnosis": [
        "pourquoi mon site n'a pas de trafic",
        "pourquoi le trafic est faible",
        "pourquoi j'ai peu de visiteurs",
        "cause du faible trafic",
        "pourquoi pas de clics",
        "pourquoi mon site ne reçoit pas de trafic",
    ],
    "pages_faibles": [
        "quelle est la page la plus faible",
        "pages faibles",
        "mauvais score",
        "pages avec score bas",
        "pages à améliorer",
    ],
    "site_info": [
        "site selectionne",
        "quel site est choisi",
        "donne moi le site actuel",
        "site courant",
    ],
    "full_analysis": [
        "analyse globale du site",
        "analyse complète du site",
        "audit complet seo",
        "donne moi une analyse complète",
        "analyse tout le site",
        "diagnostic global du site",
        "je veux une analyse globale de site",
        "je veux une analyse globale du site",
        "donne moi une analyse globale du site",
    ],
    "page_detail": [
        "pourquoi cette page est faible",
        "analyse cette page",
        "détail de la page",
        "problème de la page",
        "pourquoi la page a un score bas",
    ],
}


# ============================================================
# CORRECTION 1 — TF-IDF construit UNE SEULE FOIS au démarrage
# (plus jamais reconstruit à chaque appel)
# ============================================================
_all_sentences = []
_labels = []

for _intent, _examples in INTENT_EXAMPLES.items():
    for _ex in _examples:
        _all_sentences.append(_ex.lower())
        _labels.append(_intent)

_vectorizer = TfidfVectorizer()
_X_matrix = _vectorizer.fit_transform(_all_sentences)


# ============================================================
# DÉTECTION D'INTENTION
# ============================================================
def detect_intent_nlp(question: str) -> str:
    q = question.lower().strip()

    # Normalisation pronoms
    q = q.replace("son", "le").replace("sa", "la").replace("ses", "les")

    # ── Règles prioritaires (mots-clés explicites) ──────────
    if "analyse globale" in q or "audit complet" in q:
        return "full_analysis"
    if "analyse complète" in q and "page" not in q:
        return "full_analysis"
    if "priorité" in q or "priorites" in q:
        return "full_analysis"
    if "performant" in q or "site est bon" in q or "est-il bon" in q:
        return "full_analysis"

    if "pourquoi" in q and ("trafic" in q or "visiteurs" in q or "clics" in q):
        return "traffic_diagnosis"

    if ("améliorer" in q or "ameliorer" in q) and "trafic" in q:
        return "recommendations"

    if "prévision" in q or "prevision" in q or "forecast" in q:
        return "prediction"
    if "prédis" in q or "predis" in q or "demain" in q:
        return "prediction"

    if "kpi" in q or "indicateurs" in q:
        return "kpi"
    if "ctr" in q and "position" in q:
        return "kpi"

    if "pages faibles" in q or "pages à améliorer" in q or "mauvais score" in q:
        return "pages_faibles"

    if "recommandation" in q or "conseil" in q or "optimiser" in q:
        return "recommendations"

    if "site sélectionné" in q or "site selectionne" in q or "site courant" in q \
            or "site actuel" in q or "quel site" in q:
        return "site_info"

    if "mots clés" in q or "keywords" in q or "meta description" in q:
        return "nlp"

    if "anomalie" in q or "pages anormales" in q:
        return "anomalies"

    # GA et GSC séparés avant scraping
    if "google analytics" in q or "sessions" in q or "utilisateurs actifs" in q or "pages vues" in q:
        return "ga"

    if "search console" in q or "position google" in q or "requêtes" in q:
        return "gsc"

    if "audit seo" in q or "analyse technique" in q or "diagnostic" in q \
            or "analyse mon site" in q or "analyse du site" in q:
        return "scraping"

    # ── Fallback TF-IDF (vectorizer déjà prêt) ──────────────
    q_vec = _vectorizer.transform([q])
    sims = cosine_similarity(q_vec, _X_matrix)[0]
    best_index = int(np.argmax(sims))
    best_score = sims[best_index]

    if best_score < 0.15:
        return "unknown"

    return _labels[best_index]


# ============================================================
# SALUTATIONS / AU REVOIR
# ============================================================
def chat_greetings_farewells(question: str):
    q = question.lower()
    greetings = ["bonjour", "salut", "hello", "hi", "coucou", "bonsoir"]
    farewells = ["au revoir", "bye", "à bientôt", "ciao", "merci"]

    for word in greetings:
        if word in q:
            return "greeting"
    for word in farewells:
        if word in q:
            return "farewell"
    return None


# ============================================================
# INTRO ALÉATOIRE
# ============================================================
def polite_intro(intent: str) -> str:
    intros = {
        "kpi":             ["Voici les KPI calculés :", "Résumé des indicateurs clés :"],
        "ga":              ["Voici les données Google Analytics :", "Analyse GA :"],
        "gsc":             ["Voici les données Google Search Console :", "Analyse GSC :"],
        "prediction":      ["Voici la prévision du trafic :", "Estimation du trafic :"],
        "recommendations": ["Voici mes recommandations SEO :", "Suggestions d'amélioration :"],
        "nlp":             ["Analyse du contenu et des mots-clés :", "Résultats de l'analyse NLP :"],
        "scraping":        ["Résultats de l'audit technique :", "Analyse technique du site :"],
        "anomalies":       ["Anomalies détectées :", "Voici les pages à risque :"],
        "traffic_diagnosis": ["Diagnostic du trafic :", "Analyse des causes du faible trafic :"],
        "pages_faibles":   ["Pages à améliorer en priorité :", "Voici les pages faibles :"],
        "full_analysis":   ["Analyse globale du site :", "Voici le bilan complet :"],
        "page_detail":     ["Détail de la page demandée :", "Analyse de la page :"],
        "site_info":       ["Information sur le site sélectionné :"],
    }
    return random.choice(intros.get(intent, ["Voici la réponse :"]))


# ============================================================
# CORRECTION 2 — format_response avec ga/gsc + ZeroDivision
# ============================================================
def format_response(intent: str, data) -> str:

    # ── GA ──────────────────────────────────────────────────
    if intent == "ga":
        if not data or data.get("traffic", {}).get("total_sessions", 0) == 0:
            return "Aucune donnée Google Analytics disponible pour ce site."
        t = data["traffic"]
        return (
            "Google Analytics :\n\n"
            f"👥 Utilisateurs actifs : {t['total_active_users']}\n"
            f"🔁 Sessions : {t['total_sessions']}\n"
            f"📄 Pages vues : {t['total_page_views']}\n"
        )

    # ── GSC ─────────────────────────────────────────────────
    elif intent == "gsc":
        if not data or data.get("seo", {}).get("total_impressions", 0) == 0:
            return "Aucune donnée Google Search Console disponible pour ce site."
        s = data["seo"]
        return (
            "Google Search Console :\n\n"
            f"🖱️ Total Clicks : {s['total_clicks']}\n"
            f"👁️ Total Impressions : {s['total_impressions']}\n"
            f"📊 CTR moyen : {s['avg_ctr'] * 100:.2f}%\n"
            f"📍 Position moyenne : {s['avg_position']}\n"
        )

    # ── KPI ─────────────────────────────────────────────────
    elif intent == "kpi":
        seo = data["seo"]
        traffic = data["traffic"]
        return (
            "KPI globaux :\n\n"
            "🔍 SEO (Google Search Console) :\n"
            f"   - Total Clicks : {seo['total_clicks']}\n"
            f"   - Total Impressions : {seo['total_impressions']}\n"
            f"   - CTR moyen : {seo['avg_ctr'] * 100:.2f}%\n"
            f"   - Position moyenne : {seo['avg_position']}\n\n"
            "📈 Trafic (Google Analytics) :\n"
            f"   - Utilisateurs actifs : {traffic['total_active_users']}\n"
            f"   - Sessions : {traffic['total_sessions']}\n"
            f"   - Pages vues : {traffic['total_page_views']}\n"
        )

    # ── PREDICTION ──────────────────────────────────────────
    elif intent == "prediction":
        if not data:
            return "Pas assez de données pour effectuer une prévision."
        total_clicks = sum(r.get("predicted_clicks", 0) for r in data)
        total_impressions = sum(r.get("predicted_impressions", 0) for r in data)
        text = "Prévision du trafic (1 jour) :\n\n"
        text += f"🖱️ Clics prévus : {total_clicks}\n"
        text += f"👁️ Impressions prévues : {total_impressions}\n\n"
        if total_clicks == 0:
            text += "⚠️ Trafic très faible prévu."
        elif total_clicks < 5:
            text += "⚠️ Trafic faible prévu."
        elif total_clicks < 20:
            text += "📈 Trafic moyen prévu."
        else:
            text += "🔥 Bon trafic prévu."
        return text

    # ── RECOMMENDATIONS ─────────────────────────────────────
    elif intent == "recommendations":
        if not data:
            return "Aucune recommandation générée pour le moment."
        text = "Recommandations SEO :\n\n"
        for rec in data:
            text += f"💡 {rec}\n"
        return text

    # ── TRAFFIC DIAGNOSIS ───────────────────────────────────
    elif intent == "traffic_diagnosis":

        if not data:
            return "Impossible de diagnostiquer le trafic : données insuffisantes."

        text = "Diagnostic du trafic du site :\n\n"

        text += "Causes possibles du faible trafic :\n"
        text += "- Peu de clics depuis Google\n"
        text += "- Visibilité limitée dans les résultats de recherche\n"
        text += "- Contenu insuffisant ou peu optimisé\n"
        text += "- Titles et meta descriptions non optimisés\n\n"

        text += "Actions recommandées :\n"

        for rec in data[:3]:
            clean_rec = rec.split(":", 1)[-1]
            text += f"- {clean_rec.strip()}\n"

        return text

    elif intent == "nlp":
        if not data:
            return "Aucune donnée de contenu disponible."

        text = "Analyse du contenu et des mots-clés :\n\n"

        for page_data in data:
            text += f"📄 Page : {page_data['page']}\n"
            text += f"🔑 Mots-clés : {', '.join(page_data['top_keywords'])}\n"

            if page_data.get("issues"):
                text += "⚠️ Problèmes : " + ", ".join(page_data["issues"]) + "\n"

            if page_data.get("recommendations"):
                text += "💡 Recommandations : " + ", ".join(page_data["recommendations"]) + "\n"

            text += "\n"

        return text
    # ── SCRAPING ────────────────────────────────────────────
    elif intent == "scraping":
        if not data:
            return "Aucune donnée de scraping disponible pour ce site."
        total_pages = len(data)

        # CORRECTION 3 — protection ZeroDivisionError
        scores = [page.get("seo_score", 0) for page in data]
        avg_score = round(sum(scores) / total_pages, 2) if total_pages > 0 else 0

        weak_pages = sorted(data, key=lambda p: p.get("seo_score", 0))[:3]

        all_issues = []
        for page in data:
            all_issues.extend(page.get("issues", []))
        issue_counts = {}
        for issue in all_issues:
            issue_counts[issue] = issue_counts.get(issue, 0) + 1
        top_issues = sorted(issue_counts.items(), key=lambda x: x[1], reverse=True)[:3]

        text = "Résumé de l'audit SEO technique :\n\n"
        text += f"📄 Pages analysées : {total_pages}\n"
        text += f"⭐ Score SEO moyen : {avg_score}/100\n\n"

        if avg_score >= 85:
            text += "✅ Le site est globalement bien optimisé.\n\n"
        elif avg_score >= 70:
            text += "📈 Plusieurs optimisations sont possibles.\n\n"
        else:
            text += "⚠️ Le site nécessite des améliorations SEO importantes.\n\n"

        text += "🔻 Pages à améliorer en priorité :\n"
        for page in weak_pages:
            short_url = page["page"].replace("https://", "").replace("http://", "")
            text += f"   - {short_url} : score {page.get('seo_score', '-')}\n"

        if top_issues:
            text += "\n⚠️ Problèmes les plus fréquents :\n"
            for issue, count in top_issues:
                text += f"   - {issue} ({count} page(s))\n"

        text += "\n💡 Actions recommandées :\n"
        text += "   - Corriger les titles et meta descriptions.\n"
        text += "   - Enrichir les pages avec plus de contenu.\n"
        text += "   - Optimiser les mots-clés dans les titles et descriptions.\n"
        return text

    # ── ANOMALIES ───────────────────────────────────────────
    elif intent == "anomalies":
        if not data:
            return "✅ Aucune anomalie détectée pour le moment."
        text = "⚠️ Anomalies détectées :\n\n"
        for row in data:
            text += f"   - {row['page']} : {row.get('message', 'Anomalie détectée')}\n"
        return text

    # ── PAGES FAIBLES ────────────────────────────────────────
    elif intent == "pages_faibles":
        if not data:
            return "✅ Aucune page faible détectée pour le moment."
        text = "Pages ou axes à améliorer selon les données GA/GSC :\n\n"
        for rec in data[:5]:
            text += f"- {rec}\n"
        for i, row in enumerate(data, 1):
            url = row["page"].split(".netlify.app")[-1] if ".netlify.app" in row["page"] else row["page"]
            text += f"{i}. {url}\n"
            text += f"   Score : {row['score']}\n\n"
        return text

    # ── PAGE DETAIL ─────────────────────────────────────────
    elif intent == "page_detail":
        if not data:
            return "Je n'ai pas trouvé cette page dans les données disponibles."
        text = "📄 Détail de la page :\n\n"
        for row in data:
            text += f"URL : {row['page']}\n"
            text += f"Score global : {row.get('score', '-')}\n"
            text += f"Score technique : {row.get('technical_score', '-')}\n"
            if row.get("performance_score") not in ["-", None]:
                text += f"Score performance : {row.get('performance_score')}\n"
            if row.get("visibility_score") not in ["-", None]:
                text += f"Score visibilité : {row.get('visibility_score')}\n"
            if row.get("recommendations"):
                text += "💡 Recommandations : " + ", ".join(row["recommendations"]) + "\n"
            text += "\n"
        return text

    # ── FULL ANALYSIS ────────────────────────────────────────
    elif intent == "full_analysis":
        text = ""
        # KPI
        text += "📊 KPI principaux :\n"
        text += f"   - Clicks : {data['kpi']['seo']['total_clicks']}\n"
        text += f"   - Impressions : {data['kpi']['seo']['total_impressions']}\n"
        text += f"   - Sessions : {data['kpi']['traffic']['total_sessions']}\n\n"

        # CORRECTION 3 — ZeroDivisionError sur scraping vide
        scraping_data = data.get("scraping", [])
        if scraping_data:
            avg_score = round(
                sum(p.get("seo_score", 0) for p in scraping_data) / len(scraping_data), 2
            )
        else:
            avg_score = 0
        text += f"⭐ Score SEO moyen : {avg_score}/100\n\n"

        # Pages faibles
        weak = data.get("weak_pages", [])
        if weak:
            text += "🔻 Pages à améliorer :\n"
            for page in weak[:3]:
                text += f"   - {page['page']} (score {page['score']})\n"
            text += "\n"

        # Recommandations
        recs = data.get("recommendations", [])
        if recs:
            text += "💡 Recommandations principales :\n"
            for rec in recs[:5]:
                text += f"   - {rec}\n"

        return text

    # ── SITE INFO ────────────────────────────────────────────
    elif intent == "site_info":
        return f"🌐 Le site actuellement sélectionné est : **{data['site']}**"

    else:
        return "Je n'ai pas compris la question."

def build_chatbot_context(website_id=None, intent=None, period="all"):
    context = {
        "periode_analyse": period,
        "kpi": analyse_data(website_id, period),
    }

    if intent in ["recommendations", "traffic_diagnosis", "full_analysis", "pages_faibles"]:
        context["recommendations"] = generate_recommendations(website_id, period)

    return context

# ============================================================
# FONCTION PRINCIPALE
# ============================================================
def ask_ai(question: str, website_id=None, period="all") -> dict:

    # Salutations / au revoir
    special = chat_greetings_farewells(question)
    if special == "greeting":
        return {
            "intent": "greeting",
            "text": "Bonjour 👋 Comment puis-je vous aider concernant le SEO ou le trafic du site ?",
            "data": None,
        }
    if special == "farewell":
        return {
            "intent": "farewell",
            "text": "Au revoir et bonne continuation ! 👋",
            "data": None,
        }

    intent = detect_intent_nlp(question)
    if intent in [
        "traffic_diagnosis",
        "full_analysis",
        "recommendations",
        "anomalies",
        "pages_faibles",
        "page_detail",
        "scraping",
    ]:
        context = build_chatbot_context(website_id, intent,period)
        rag_docs = retrieve_relevant_documents(question, website_id, top_k=5)

        prompt = build_chatbot_prompt(
    question=question,
    context={
        "periode_analyse": period,
        "context_structuré": context,
        "documents_rag": rag_docs,
    }
)
        try:
            gemini = GeminiService()
            ai_text = gemini.generate_text(prompt)
            return {
    "intent": intent,
    "text": ai_text,
    "data": {
        "context_structuré": context,
        "documents_rag": rag_docs,
    },
    "source": "gemini_rag",
    "used_rag": True,
    "retrieved_documents_count": len(rag_docs),
}
        except Exception as e:
            print("Erreur Gemini RAG :", e)
    # CORRECTION 4 — tous les intents sont gérés, y compris ga et gsc
    if intent == "kpi":
        data = analyse_data(website_id, period)

    elif intent == "ga":
        # ga retourne le même format que analyse_data mais on peut filtrer
        data = analyse_data(website_id, period)

    elif intent == "gsc":
        # gsc retourne le même format, la réponse formatée n'affiche que la partie seo
        data = analyse_data(website_id, period)

    elif intent == "scraping":
        data = nlp_analysis(website_id)

    elif intent == "prediction":
        data = predict_traffic(days_ahead=1, website_id=website_id)

    elif intent == "recommendations":
        data = generate_recommendations(website_id,period)

    elif intent == "traffic_diagnosis":
        # même logique que recommendations mais formulé différemment
        data = generate_recommendations(website_id,period)

    elif intent == "nlp":
        data = nlp_analysis(website_id)

    elif intent == "anomalies":
        data = get_anomalies(website_id)

    elif intent == "pages_faibles":
        data = get_weak_pages(website_id)

    elif intent == "page_detail":
        data = get_page_detail(question, website_id)

    elif intent == "site_info":
        try:
            site = Website.objects.get(id=website_id)
            data = {"site": site.name}
        except Exception:
            data = {"site": "Site inconnu"}

    elif intent == "full_analysis":
        kpi = analyse_data(website_id, period)
        recs = generate_recommendations(website_id, period)

        data = {
            "kpi": kpi,
            "recommendations": recs,
      }

    else:  # unknown
        return {
            "intent": "unknown",
            "text": (
                "Je n'ai pas compris votre question 🤔\n"
                "Essayez par exemple :\n"
                "- 'Donne moi les KPI'\n"
                "- 'Analyse Google Analytics'\n"
                "- 'Quelles sont les anomalies ?'\n"
                "- 'Donne moi des recommandations SEO'"
            ),
            "data": None,
        }

    intro = polite_intro(intent)
    text = f"{intro}\n\n{format_response(intent, data)}"

    return {
    "intent": intent,
    "text": text,
    "data": data,
    "source": "structured_data",
    "used_rag": False,
    "retrieved_documents_count": 0,
}