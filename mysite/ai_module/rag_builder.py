from .ai_model import (
    analyse_data,
    get_anomalies,
    get_weak_pages,
    generate_recommendations,
    
)


def build_rag_documents(website_id=None):
    documents = []

    # 1. KPI GA + GSC
    try:
        kpi = analyse_data(website_id)

        seo = kpi.get("seo", {})
        traffic = kpi.get("traffic", {})

        documents.append({
            "type": "kpi",
            "text": (
                f"Le site possède {seo.get('total_clicks', 0)} clics, "
                f"{seo.get('total_impressions', 0)} impressions, "
                f"un CTR moyen de {seo.get('avg_ctr', 0)} "
                f"et une position moyenne de {seo.get('avg_position', 0)}. "
                f"Il possède aussi {traffic.get('total_sessions', 0)} sessions, "
                f"{traffic.get('total_active_users', 0)} utilisateurs actifs "
                f"et {traffic.get('total_page_views', 0)} pages vues."
            )
        })
    except Exception as e:
        print("Erreur RAG KPI :", e)

    
    # 3. Anomalies
    try:
        anomalies = get_anomalies(website_id)

        for anomaly in anomalies:
            documents.append({
                "type": "anomaly",
                "text": (
                    f"Anomalie détectée sur la page {anomaly.get('page')}. "
                    f"Détail : {anomaly.get('message', 'Anomalie détectée')}."
                )
            })
    except Exception as e:
        print("Erreur RAG anomalies :", e)

    # 4. Pages faibles
    try:
        weak_pages = get_weak_pages(website_id)

        for page in weak_pages:
            score = float(page.get("score", 0))
            if score < 85:
                documents.append({
            "type": "weak_page",
            "text": (
                f"La page {page.get('page')} est une page faible avec un score de "
                f"{score}. Elle doit être améliorée en priorité."
            )
        })
            else:
                documents.append({
            "type": "page_correcte",
            "text": (
                f"La page {page.get('page')} a un score correct de "
                f"{score}. Elle n'est pas prioritaire."
            )
        })
    except Exception as e:
        print("Erreur RAG pages faibles :", e)

    # 5. Recommandations globales
    try:
        recommendations = generate_recommendations(website_id)

        for rec in recommendations:
            documents.append({
                "type": "recommendation",
                "text": f"Recommandation SEO : {rec}"
            })
    except Exception as e:
        print("Erreur RAG recommandations :", e)

    return documents