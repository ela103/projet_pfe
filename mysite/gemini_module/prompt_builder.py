def build_seo_prediction_prompt(ga_kpis: dict, ga_daily: list, gsc_kpis: dict, gsc_daily: list, ga_events: list) -> str:
    return f"""
Tu es un expert SEO, web analytics et comportement utilisateur.

Voici les données Google Analytics 4 :

KPI globaux GA4 :
{ga_kpis}

Données journalières GA4 :
{ga_daily}

Voici les données Google Search Console :

KPI globaux GSC :
{gsc_kpis}

Données journalières GSC :
{gsc_daily}

Voici les événements utilisateurs (GA Events) par page :
{ga_events}

Ta mission :
1. Faire un diagnostic global du site
2. Identifier les principaux problèmes SEO et trafic
3. Analyser le comportement utilisateur par page
4. Identifier les pages qui ont :
   - beaucoup de trafic mais peu d’engagement
   - peu de trafic mais un bon engagement
5. Donner des recommandations SEO concrètes
6. Donner des recommandations UX / contenu
7. Estimer la tendance probable du trafic sur les 7 prochains jours
8. Donner une estimation prudente du nombre de sessions prévues sur 7 jours
9. Indiquer un niveau de confiance
10. Si les données Search Console sont nulles ou insuffisantes, le préciser clairement

Consignes importantes :
- Base-toi uniquement sur les données fournies
- N'invente pas de données absentes
- Si les données sont faibles, indique une confiance faible
- Réponds en français
"""
def build_stats_analysis_prompt(chart_data: list, gsc_data: list, events_data: list) -> str:
    total_users = sum(item.get("users", 0) for item in chart_data)
    total_sessions = sum(item.get("sessions", 0) for item in chart_data)
    total_page_views = sum(item.get("pageViews", 0) for item in chart_data)
    total_gsc_clicks = sum(item.get("value", 0) for item in gsc_data)

    top_page = None
    if gsc_data:
        top_page = max(gsc_data, key=lambda x: x.get("value", 0))

    return f"""
Tu es un analyste de données web (SEO et analytics).

⚠️ IMPORTANT :
- Tu dois faire UNIQUEMENT une analyse descriptive.
- Tu ne dois donner AUCUNE recommandation.
- Tu ne dois proposer AUCUNE action.
- Interdiction d’utiliser les mots : "recommandation", "optimiser", "améliorer", "il faut", "vous devriez", "conseil".

Résumé global :
- Total utilisateurs : {total_users}
- Total sessions : {total_sessions}
- Total pages vues : {total_page_views}
- Total clics GSC : {total_gsc_clicks}
- Page la plus performante : {top_page.get("name") if top_page else "Aucune"}

Données Google Analytics :
{chart_data}

Données Google Search Console :
{gsc_data}

Données d'événements :
{events_data}

Ta mission :
1. Décrire les performances globales
2. Identifier les tendances (hausse, baisse, anomalies)
3. Analyser le comportement utilisateur par page
4. Identifier les pages fortes et faibles
5. Signaler les limites des données

Structure attendue :

Analyse globale :
...

Analyse du trafic :
...

Analyse GSC :
...

Analyse comportement utilisateur :
...

Points forts :
- ...
- ...

Points faibles :
- ...
- ...

Synthèse :
...

⚠️ Rappel :
Aucune recommandation ne doit apparaître dans la réponse.
"""
def build_recommendations_prompt(chart_data: list, gsc_data: list, events_data: list) -> str:
    return f"""
Tu es un expert SEO, web analytics, UX et optimisation de contenu.

Données Google Analytics :
{chart_data}

Données Google Search Console :
{gsc_data}

Données d'événements utilisateurs :
{events_data}

Ta mission :
1. Donner uniquement des recommandations concrètes
2. Séparer les recommandations SEO, UX et trafic
3. Prioriser les actions les plus importantes
4. Préciser si certaines recommandations sont limitées par le manque de données

Consignes :
- Base-toi uniquement sur les données fournies
- N’invente pas d’informations absentes
- Réponds en français
- Va directement à l’action
- Ne fais pas une longue analyse descriptive
- Structure la réponse comme ceci :

Recommandations SEO :
1. ...
2. ...
3. ...

Recommandations UX / contenu :
1. ...
2. ...
3. ...

Recommandations trafic / visibilité :
1. ...
2. ...
3. ...

Priorité :
...
"""