from django.http import JsonResponse
from django.conf import settings

from data_module.google_analytics import get_ga4_kpis, get_ga4_daily
from data_module.search_console import get_gsc_kpis, get_gsc_daily
from .gemini_service import GeminiService
from .prompt_builder import build_seo_prediction_prompt,build_stats_analysis_prompt,build_recommendations_prompt
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from data_module.models import GAEvent


def gemini_test(request):
    try:
        # Données GA4
        ga_kpis = get_ga4_kpis(settings.GA4_PROPERTY_ID)
        ga_daily = get_ga4_daily(settings.GA4_PROPERTY_ID, days=30)

        # Données GSC
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

        # Construire le prompt avec GA4 + GSC
        prompt = build_seo_prediction_prompt(
            ga_kpis=ga_kpis,
            ga_daily=ga_daily,
            gsc_kpis=gsc_kpis,
            gsc_daily=gsc_daily
        )

        # Appel Gemini
        gemini = GeminiService()
        response = gemini.generate_text(prompt)

        return JsonResponse({
            "success": True,
            "ga_kpis": ga_kpis,
            "ga_daily": ga_daily,
            "gsc_kpis": gsc_kpis,
            "gsc_daily": gsc_daily,
            "ga_events": ga_events,
            "ai_response": response
            
        })

    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        })
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

        print("🔥 GEMINI APPELÉ DANS analyze_stats")
        print("MODE =", mode)
        print("CHART DATA =", chart_data)
        print("GSC DATA =", gsc_data)
        print("EVENTS DATA =", events_data)
        print("PROMPT =", prompt)

        gemini = GeminiService()
        result_text = gemini.generate_text(prompt)

        print("REPONSE GEMINI =", result_text)

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
        print("ERREUR ANALYZE_STATS = JSON invalide")
        return JsonResponse({"message": "JSON invalide."}, status=400)

    except Exception as e:
        print("ERREUR ANALYZE_STATS =", str(e))
        return JsonResponse({"message": str(e)}, status=500)