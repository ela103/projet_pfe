from django.contrib import admin

from .models import (
    Competitor,
    Keyword,
    SerpResult,
    TrafficEstimate,
    ScrapedCompetitorPage,
)


@admin.register(Competitor)
class CompetitorAdmin(admin.ModelAdmin):
    list_display = ("id", "domain", "sector", "country", "created_at")
    search_fields = ("domain",)


@admin.register(Keyword)
class KeywordAdmin(admin.ModelAdmin):
    list_display = ("id", "keyword", "theme", "created_at")
    search_fields = ("keyword",)


@admin.register(SerpResult)
class SerpResultAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "keyword",
        "competitor",
        "position",
        "source",
        "collected_at",
    )

    search_fields = ("url", "title")


@admin.register(TrafficEstimate)
class TrafficEstimateAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "competitor",
        "total_visits",
        "bounce_rate",
        "pages_per_visit",
        "collected_at",
    )


@admin.register(ScrapedCompetitorPage)
class ScrapedCompetitorPageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "competitor",
        "url",
        "word_count",
        "scraped_at",
    )

    search_fields = ("url", "title")