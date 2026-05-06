from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from collections import Counter
import json

from data_module.google_analytics import get_ga4_kpis, get_ga4_daily
from data_module.search_console import get_gsc_kpis, get_gsc_daily
from data_module.models import GAEvent, ScrapedPage
from data_module.models import Website

from .gemini_service import GeminiService
from .prompt_builder import (
    build_seo_prediction_prompt,
    build_stats_analysis_prompt,
    build_recommendations_prompt,
)


def gemini_test(request):
    try:
        # 🔥 1. récupérer website_id depuis l'URL
        website_id = request.GET.get("website_id")

        if not website_id:
            return JsonResponse({
                "success": False,
                "error": "website_id est requis"
            }, status=400)

        # 🔥 2. récupérer le site
        website = Website.objects.get(id=website_id)

        # 🔥 3. utiliser les données du site (DYNAMIQUE)
        ga_kpis = get_ga4_kpis(website.ga4_property_id)
        ga_daily = get_ga4_daily(website.ga4_property_id, days=30)

        gsc_kpis = get_gsc_kpis(website.gsc_site_url, days=30)
        gsc_daily = get_gsc_daily(website.gsc_site_url, days=30)

        # 🔥 4. filtrer les events par site (important)
        ga_events = list(
            GAEvent.objects.filter(
                website_id=website.id,
                page_path__isnull=False
            )
            .order_by("-date")
            .values(
                "date",
                "page_path",
                "event_name",
                "event_count",
                "users",
                "event_count_per_user",
            )[:100]
        )

        prompt = build_seo_prediction_prompt(
            website_id=website.id,
            ga_kpis=ga_kpis,
            ga_daily=ga_daily,
            gsc_kpis=gsc_kpis,
            gsc_daily=gsc_daily,
            ga_events=ga_events,
        )

        gemini = GeminiService()
        response = gemini.generate_text(prompt)

        return JsonResponse({
           "success": True,
    "website_id": website.id,
    "website_name": website.name,
    "ga4_property_id_used": website.ga4_property_id,
    "gsc_site_url_used": website.gsc_site_url,
    "ga_kpis": ga_kpis,
    "ga_daily": ga_daily,
    "gsc_kpis": gsc_kpis,
    "gsc_daily": gsc_daily,
    "ga_events": ga_events,
    "ai_response": response,
        })

    except Website.DoesNotExist:
        return JsonResponse({
            "success": False,
            "error": "Website introuvable"
        }, status=404)

    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)

@csrf_exempt
@require_POST
def analyze_stats(request):
    try:
        body = json.loads(request.body.decode("utf-8"))
        chart_data = body.get("chartData", [])
        gsc_data = body.get("gscData", [])
        events_data = body.get("eventsData", [])
        mode = body.get("mode", "analysis")

        if mode not in ["analysis", "recommendations"]:
            return JsonResponse({"message": "Mode invalide."}, status=400)

        if not chart_data and not gsc_data and not events_data:
            return JsonResponse({"message": "Aucune donnée à analyser."}, status=400)

        if mode == "recommendations":
            prompt = build_recommendations_prompt(chart_data, gsc_data, events_data)
        else:
            prompt = build_stats_analysis_prompt(chart_data, gsc_data, events_data)

        gemini = GeminiService()
        result_text = gemini.generate_text(prompt)

        if mode == "recommendations":
            return JsonResponse({
                "mode": "recommendations",
                "recommendations": result_text
            })

        return JsonResponse({
            "mode": "analysis",
            "analysis": result_text
        })

    except json.JSONDecodeError:
        return JsonResponse({"message": "JSON invalide."}, status=400)

    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)


def seo_global_insight(request):
    website_id = request.GET.get("website_id")

    if not website_id:
        return JsonResponse({"error": "website_id requis"}, status=400)

    try:
        website = Website.objects.get(id=website_id)
    except Website.DoesNotExist:
        return JsonResponse({"error": "Website introuvable"}, status=404)

    pages = ScrapedPage.objects.filter(website=website)

    if not pages.exists():
        return JsonResponse({"error": "No data"}, status=404)

    all_issues = []
    all_recommendations = []

    for page in pages:
        all_issues.extend(page.issues or [])
        all_recommendations.extend(page.recommendations or [])

    total_issues = len(all_issues)

    most_common_issue = None
    if all_issues:
        most_common_issue = Counter(all_issues).most_common(1)[0][0]

    top_recommendations = []
    if all_recommendations:
        top_recommendations = [
            item[0] for item in Counter(all_recommendations).most_common(3)
        ]

    fallback_summary = (
        f"Le site {website.name} présente actuellement {total_issues} problème(s) SEO détecté(s). "
        f"Le problème le plus fréquent est : {most_common_issue or 'aucun problème dominant identifié'}. "
        f"Les actions prioritaires recommandées sont : "
        f"{'; '.join(top_recommendations) if top_recommendations else 'aucune recommandation disponible'}."
    )

    prompt = f"""
    Voici un audit SEO global du site : {website.name}

    Nombre total de problèmes : {total_issues}
    Problème le plus fréquent : {most_common_issue}

    Recommandations détectées :
    {chr(10).join(f"- {rec}" for rec in top_recommendations)}

    Génère :
    1. Un résumé professionnel du SEO du site en 4 à 5 lignes.
    2. Trois actions prioritaires globales, claires et concrètes.
    """

    try:
        gemini = GeminiService()
        ai_result = gemini.generate_text(prompt)

        return JsonResponse({
            "website_id": website.id,
            "website_name": website.name,
            "total_issues": total_issues,
            "most_common_issue": most_common_issue,
            "top_recommendations": top_recommendations,
            "ai_summary": ai_result,
            "source": "gemini"
        })

    except Exception as e:
        return JsonResponse({
            "website_id": website.id,
            "website_name": website.name,
            "total_issues": total_issues,
            "most_common_issue": most_common_issue,
            "top_recommendations": top_recommendations,
            "ai_summary": fallback_summary,
            "source": "fallback",
            "ai_error": str(e)
        }, status=200)
@csrf_exempt
@require_POST
def chatbot_api(request):
    try:
        body = json.loads(request.body.decode("utf-8"))
        message = body.get("message", "").strip()
        website_id = body.get("website_id")

        if not message:
            return JsonResponse({"error": "Message vide."}, status=400)

        simple_greetings = ["bonjour", "salut", "hello", "hi", "bonsoir"]

        if message.lower() in simple_greetings:
            return JsonResponse({
                "success": True,
                "reply": "Bonjour 👋 Je suis votre assistant SEO. Posez-moi une question sur votre trafic, votre SEO ou les performances de votre site."
            })

        context_data = ""

        if website_id:
            try:
                website = Website.objects.get(id=website_id)

                ga_kpis = get_ga4_kpis(website.ga4_property_id)
                gsc_kpis = get_gsc_kpis(website.gsc_site_url, days=30)

                context_data = f"""
Données du site :
- Utilisateurs : {ga_kpis.get('activeUsers')}
- Sessions : {ga_kpis.get('sessions')}
- Clics : {gsc_kpis.get('clicks')}
- Impressions : {gsc_kpis.get('impressions')}
- CTR : {gsc_kpis.get('ctr')}
- Position moyenne : {gsc_kpis.get('position')}
"""
            except Exception:
                context_data = "Aucune donnée disponible pour ce site."

        prompt = f"""
Tu es un expert SEO intelligent et concis.

Contexte du site :
{context_data}

Question utilisateur :
{message}

Instructions STRICTES :
- Réponds directement à la question, sans blabla inutile
- Si la question est simple, réponds en 2 à 3 phrases maximum
- Si l’utilisateur demande une analyse, structure la réponse ainsi :
  1. Analyse rapide
  2. Problème principal
  3. Action recommandée
- Si les données sont faibles, nulles ou indisponibles, dis-le en une phrase puis donne 2 conseils maximum
- Évite de répéter toujours les mêmes explications générales
- Sois clair, utile et professionnel
- Réponds en français

Réponse :
"""

        try:
            gemini = GeminiService()
            ai_response = gemini.generate_text(prompt)

            return JsonResponse({
                "success": True,
                "reply": ai_response
            })

        except Exception as e:
            fallback_reply = """Le service IA est temporairement indisponible. Voici quelques conseils SEO de base :

- Améliorez vos titres et méta descriptions
- Travaillez le contenu de qualité
- Optimisez la vitesse du site
- Ajoutez des liens internes"""

            return JsonResponse({
                "success": True,
                "reply": fallback_reply,
                "source": "fallback",
                "error": str(e)
            })

    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON invalide."}, status=400)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)