from .chat_ai import ask_ai
from .ai_model import analyse_data, generate_recommendations, get_anomalies, get_weak_pages


def generate_weekly_seo_summary(website_id=None):
    period = "week"

    kpi = analyse_data(website_id=website_id, period=period)
    recommendations = generate_recommendations(website_id=website_id, period=period)
    anomalies = get_anomalies(website_id=website_id)
    weak_pages = get_weak_pages(website_id=website_id)

    question = f"""
Génère un résumé hebdomadaire SEO court et clair à partir des données suivantes.

Données SEO :
{kpi.get("seo")}

Données trafic :
{kpi.get("traffic")}

Recommandations :
{recommendations[:3]}

Anomalies :
{anomalies[:3]}

Pages faibles :
{weak_pages[:3]}

Format obligatoire :
- 3 à 5 phrases maximum.
- Pas de longues explications.
- Ton professionnel et simple.
- Mentionner seulement les points les plus importants.
- Terminer par une recommandation principale.

Le résumé doit être directement utilisable dans un email ou une notification.
"""
    result = ask_ai(question, website_id, period)

    if isinstance(result, dict):
        summary_text = (
            result.get("text")
            or result.get("response")
            or result.get("answer")
            or str(result)
        )
    else:
        summary_text = str(result)

    return {
        "title": "Résumé hebdomadaire SEO",
        "website_id": website_id,
        "period": period,
        "summary": summary_text,
        "kpi": kpi,
        "recommendations": recommendations,
        "anomalies": anomalies,
        "weak_pages": weak_pages,
    }