from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from collections import Counter
import json

from data_module.google_analytics import get_ga4_kpis, get_ga4_daily
from data_module.search_console import get_gsc_kpis, get_gsc_daily
from data_module.models import GAEvent, ScrapedPage

from .gemini_service import GeminiService
from .prompt_builder import (
    build_seo_prediction_prompt,
    build_stats_analysis_prompt,
    build_recommendations_prompt,
)


def gemini_test(request):
    try:
        ga_kpis = get_ga4_kpis(settings.GA4_PROPERTY_ID)
        ga_daily = get_ga4_daily(settings.GA4_PROPERTY_ID, days=30)

        gsc_kpis = get_gsc_kpis(settings.GSC_SITE_URL, days=30)
        gsc_daily = get_gsc_daily(settings.GSC_SITE_URL, days=30)

        ga_events = list(
            GAEvent.objects.filter(page_path__isnull=False)
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
            ga_kpis=ga_kpis,
            ga_daily=ga_daily,
            gsc_kpis=gsc_kpis,
            gsc_daily=gsc_daily,
        )

        gemini = GeminiService()
        response = gemini.generate_text(prompt)

        return JsonResponse({
            "success": True,
            "ga_kpis": ga_kpis,
            "ga_daily": ga_daily,
            "gsc_kpis": gsc_kpis,
            "gsc_daily": gsc_daily,
            "ga_events": ga_events,
            "ai_response": response,
        })

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

    pages = ScrapedPage.objects.filter(website_id=website_id)

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
        f"Le site présente actuellement {total_issues} problème(s) SEO détecté(s). "
        f"Le problème le plus fréquent est : {most_common_issue or 'aucun problème dominant identifié'}. "
        f"Les actions prioritaires recommandées sont : "
        f"{'; '.join(top_recommendations) if top_recommendations else 'aucune recommandation disponible'}."
    )

    prompt = f"""
    Voici un audit SEO global d’un site web.

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
            "total_issues": total_issues,
            "most_common_issue": most_common_issue,
            "top_recommendations": top_recommendations,
            "ai_summary": ai_result,
            "source": "gemini"
        })

    except Exception as e:
        return JsonResponse({
            "total_issues": total_issues,
            "most_common_issue": most_common_issue,
            "top_recommendations": top_recommendations,
            "ai_summary": fallback_summary,
            "source": "fallback",
            "ai_error": str(e)
        }, status=200)