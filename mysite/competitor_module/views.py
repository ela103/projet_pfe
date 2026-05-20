from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes

from .models import (
    Competitor,
    Keyword,
    SerpResult,
    ScrapedCompetitorPage,
    TrafficEstimate,
)

from .serializers import (
    CompetitorSerializer,
    KeywordSerializer,
    SerpResultSerializer,
    ScrapedCompetitorPageSerializer,
    TrafficEstimateSerializer,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def keywords_list(request):
    keywords = Keyword.objects.all().order_by("-created_at")
    serializer = KeywordSerializer(keywords, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def competitors_list(request):
    competitors = Competitor.objects.all().order_by("-created_at")
    serializer = CompetitorSerializer(competitors, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def serp_results_list(request):
    keyword_id = request.GET.get("keyword_id")

    results = SerpResult.objects.select_related(
        "keyword",
        "competitor"
    ).all()

    if keyword_id:
        results = results.filter(keyword_id=keyword_id)

    results = results.order_by("position")

    serializer = SerpResultSerializer(results, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def scraped_pages_list(request):
    competitor_id = request.GET.get("competitor_id")

    pages = ScrapedCompetitorPage.objects.select_related(
        "competitor"
    ).all()

    if competitor_id:
        pages = pages.filter(competitor_id=competitor_id)

    pages = pages.order_by("-scraped_at")

    serializer = ScrapedCompetitorPageSerializer(pages, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def traffic_estimates_list(request):
    estimates = TrafficEstimate.objects.select_related(
        "competitor"
    ).all().order_by("-collected_at")

    serializer = TrafficEstimateSerializer(estimates, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def top_competitors_by_keyword(request):
    keyword_id = request.GET.get("keyword_id")

    if not keyword_id:
        return Response({
            "error": "keyword_id est obligatoire"
        }, status=400)

    results = SerpResult.objects.select_related(
        "keyword",
        "competitor"
    ).filter(
        keyword_id=keyword_id
    ).order_by("position")[:10]

    serializer = SerpResultSerializer(results, many=True)
    return Response(serializer.data)