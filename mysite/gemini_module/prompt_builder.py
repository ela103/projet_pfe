def build_seo_prediction_prompt(ga_kpis: dict, ga_daily: list, gsc_kpis: dict, gsc_daily: list) -> str:
    return f"""
Tu es un expert SEO et web analytics.

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

Ta mission :
1. Faire un diagnostic global du site
2. Identifier les principaux problèmes SEO et trafic
3. Donner des recommandations SEO concrètes
4. Estimer la tendance probable du trafic sur les 7 prochains jours
5. Donner une estimation prudente du nombre de sessions prévues sur 7 jours
6. Indiquer un niveau de confiance
7. Si les données Search Console sont nulles ou insuffisantes, le préciser clairement

Consignes importantes :
- Base-toi uniquement sur les données fournies
- N'invente pas de données absentes
- Si les données sont faibles, indique une confiance faible
- Réponds en français
"""