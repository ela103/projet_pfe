from ai_module.ai_model import detect_seo_issues

def build_seo_prediction_prompt(
    website_id,
    ga_kpis: dict,
    ga_daily: list,
    gsc_kpis: dict,
    gsc_daily: list,
    ga_events: list
) -> str:

   
    issues = detect_seo_issues(website_id)

    return f"""
Tu es un expert SEO, web analytics et comportement utilisateur.

Voici les anomalies SEO détectées automatiquement :
{issues}

Tu dois analyser ces anomalies et expliquer les causes en détail.

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
def build_chatbot_prompt(question, context, response_mode="detailed"):
    periode = context.get("periode_analyse", "all")
    context_structure = context.get("context_structuré")
    documents_rag = context.get("documents_rag")
    compact_rules = ""

    if response_mode == "compact":
        compact_rules = """
MODE CHATBOT COMPACT :
- Réponds de façon courte et conversationnelle.
- Maximum 5 à 8 lignes au total.
- Pour une analyse globale, donne seulement : 1 résumé court, 3 constats clés, 1 conclusion.
- Pour des recommandations, donne maximum 3 actions prioritaires.
- Évite les longs rapports, les longues listes et les sous-sections nombreuses.
- Ne répète pas toutes les données disponibles ; cite seulement les chiffres vraiment utiles.
- En mode compact, les structures détaillées ci-dessous sont seulement indicatives : privilégie toujours la version courte.
"""

    return f"""
Tu es un assistant SEO intelligent connecté aux données réelles d'un dashboard web analytics.

Question utilisateur :
{question}

Période d'analyse demandée :
{periode}

Données structurées disponibles :
{context_structure}

Documents récupérés par le RAG :
{documents_rag}

RÈGLES IMPORTANTES :
- Tu dois te baser uniquement sur les données fournies dans le contexte.
- Les seules sources autorisées sont :
  1. Website
  2. Google Analytics 4 / GAMetrics
  3. Google Search Console / GSCMetrics
  4. GA Events / GAEvent
- Ne parle pas de scraping.
- Ne parle pas de score technique.
- Ne parle pas de score SEO issu du contenu, du title ou de la meta description.
- Ne dis pas qu'une page est faible si cela n'est pas prouvé par les métriques GA4, GSC ou GAEvent.
- Si une information n'existe pas dans les données, dis clairement qu'elle n'est pas disponible.
- N'invente jamais de pages, de mots-clés, de causes ou de chiffres.
- Si les volumes sont faibles, indique que l'interprétation doit rester prudente.

LOGIQUE D'ANALYSE :
- Si les clics sont faibles mais que le CTR est bon, explique que le problème principal est probablement le faible volume d'impressions.
- Si les impressions sont élevées mais que le CTR est faible, explique que les snippets Google peuvent être peu attractifs.
- Si la position moyenne est élevée numériquement, par exemple supérieure à 15, explique que la visibilité organique est faible.
- Si les sessions sont faibles, explique que l'acquisition de trafic est limitée.
- Si les pages vues sont faibles par rapport aux sessions, explique que la profondeur de navigation peut être faible.
- Si les événements GA sont faibles ou absents, explique que l'engagement ou les conversions ne peuvent pas être confirmés.
- Si les données GSC sont nulles ou insuffisantes, précise que l'analyse SEO est limitée.
- Si les données GA4 sont nulles ou insuffisantes, précise que l'analyse du comportement utilisateur est limitée.

STYLE DE RÉPONSE :
Réponds en français, avec une structure claire.
{compact_rules}

Si la question concerne une analyse globale, utilise cette structure :

Résumé global :
...

Analyse GA4 :
...

Analyse Search Console :
...

Analyse des événements :
...

Points à surveiller :
- ...
- ...

Conclusion :
...

Si la question concerne un diagnostic trafic, utilise cette structure :

Diagnostic du trafic :
...

Causes probables :
1. ...
2. ...
3. ...

Signaux observés dans les données :
- ...
- ...

Actions prioritaires :
1. ...
2. ...
3. ...

Limites de l'analyse :
...

Si la question concerne des recommandations, utilise cette structure :

Recommandations SEO :
1. ...
2. ...
3. ...

Recommandations trafic :
1. ...
2. ...
3. ...

Recommandations engagement / événements :
1. ...
2. ...
3. ...

Priorité :
...

Si la question concerne les pages à améliorer, ne parle pas de score technique.
Présente uniquement les pages ou axes qui ressortent des métriques GA4/GSC/GAEvent.

Réponse :
"""


