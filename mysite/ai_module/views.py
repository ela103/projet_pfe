import json
import os

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

from .ai_model import analyse_data, generate_recommendations, predict_traffic, nlp_analysis,calculate_site_score
from .chat_ai import ask_ai


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
        result = ask_ai(question)
        return JsonResponse({"response": result})

    return JsonResponse({"error": "POST only"})