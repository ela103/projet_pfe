from django.http import JsonResponse
from django.conf import settings

from data_module.google_analytics import get_ga4_kpis, get_ga4_daily
from data_module.search_console import get_gsc_kpis, get_gsc_daily
from .gemini_service import GeminiService
from .prompt_builder import build_seo_prediction_prompt



def gemini_test(request):
    try:
        # Données GA4
        ga_kpis = get_ga4_kpis(settings.GA4_PROPERTY_ID)
        ga_daily = get_ga4_daily(settings.GA4_PROPERTY_ID, days=30)

        # Données GSC
        gsc_kpis = get_gsc_kpis(settings.GSC_SITE_URL, days=30)
        gsc_daily = get_gsc_daily(settings.GSC_SITE_URL, days=30)

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
            "ai_response": response
        })

    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        })