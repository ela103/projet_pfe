import json
import os

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

from .ai_model import analyse_data, generate_recommendations, predict_traffic, nlp_analysis,calculate_site_score
from .chat_ai import ask_ai
from django.views.decorators.http import require_GET
from .weekly_summary import generate_weekly_seo_summary


def test_ai(request):
    pages = nlp_analysis()
    site = calculate_site_score()

    result = {
        "analysis": analyse_data(),
        "recommendations": generate_recommendations(),
        "prediction": predict_traffic(days_ahead=1),
        "pages": pages,
        "site": site
    }

    return JsonResponse(result)


@csrf_exempt
def ai_chat(request):
    if request.method == "POST":
        data = json.loads(request.body.decode("utf-8"))

        question = data.get("question", "")
        website_id = data.get("website_id")
        period = data.get("period", "all")

        print("website_id reçu :", website_id)
        print("period reçu :", period)

        result = ask_ai(question, website_id, period)

        return JsonResponse({"response": result})

    return JsonResponse({"error": "POST only"})

@require_GET
def weekly_seo_summary(request):
    website_id = request.GET.get("website_id")

    try:
        summary = generate_weekly_seo_summary(website_id=website_id)

        return JsonResponse({
            "success": True,
            "title": summary.get("title", "Résumé hebdomadaire SEO"),
            "website_id": summary.get("website_id", website_id),
            "period": summary.get("period", "week"),
            "summary": summary.get("summary", ""),
            "kpi": summary.get("kpi", {}),
            "recommendations": summary.get("recommendations", []),
            "anomalies": summary.get("anomalies", []),
            "weak_pages": summary.get("weak_pages", []),
            "dashboard_url": "http://127.0.0.1:3000/dashboard",
            "message": "Résumé hebdomadaire généré avec succès.",
        })

    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e),
        }, status=500)