from rest_framework import serializers

from .models import (
    Competitor,
    Keyword,
    SerpResult,
    ScrapedCompetitorPage,
    TrafficEstimate,
)


class CompetitorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Competitor
        fields = "__all__"


class KeywordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Keyword
        fields = "__all__"


class TrafficEstimateSerializer(serializers.ModelSerializer):
    competitor = CompetitorSerializer(read_only=True)

    class Meta:
        model = TrafficEstimate
        fields = "__all__"


class SerpResultSerializer(serializers.ModelSerializer):
    keyword = KeywordSerializer(read_only=True)
    competitor = CompetitorSerializer(read_only=True)

    class Meta:
        model = SerpResult
        fields = "__all__"


class ScrapedCompetitorPageSerializer(serializers.ModelSerializer):
    competitor = CompetitorSerializer(read_only=True)

    class Meta:
        model = ScrapedCompetitorPage
        fields = "__all__"