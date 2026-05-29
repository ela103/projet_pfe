from django.contrib import admin
from .models import (
    Website,
    GAMetrics,
    GSCMetrics,
    GAEvent,
    AIPageScore,
    AISiteScore,
)


@admin.register(Website)
class WebsiteAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "ga4_property_id",
        "gsc_site_url",
        "added_by",
        "created_at",
    )

    readonly_fields = ("added_by", "created_at")

    def save_model(self, request, obj, form, change):
        if not obj.added_by:
            obj.added_by = request.user

        super().save_model(request, obj, form, change)


@admin.register(AIPageScore)
class AIPageScoreAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "website",
        "page",
        "score",
        "level",
        "priority",
        "updated_at",
    )
    search_fields = ("website__name", "page")
    list_filter = ("level", "priority", "website")


@admin.register(AISiteScore)
class AISiteScoreAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "website",
        "global_score",
        "level",
        "priority",
        "updated_at",
    )
    search_fields = ("website__name",)
    list_filter = ("level", "priority")


admin.site.register(GAMetrics)
admin.site.register(GSCMetrics)
admin.site.register(GAEvent)