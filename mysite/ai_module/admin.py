from django.contrib import admin

from .models import AIChatMessage, AIRecommendation


@admin.register(AIRecommendation)
class AIRecommendationAdmin(admin.ModelAdmin):
    list_display = (
        "website",
        "user",
        "period",
        "status",
        "created_at",
    )
    list_filter = ("status", "period", "tool", "created_at")
    search_fields = (
        "website__name",
        "user__email",
        "question",
        "content",
    )
    readonly_fields = ("created_at", "updated_at")


@admin.register(AIChatMessage)
class AIChatMessageAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "website",
        "intent",
        "source",
        "created_at",
    )
    list_filter = ("source", "intent", "used_rag", "created_at")
    search_fields = (
        "user__email",
        "website__name",
        "question",
        "answer",
    )
    readonly_fields = ("created_at",)
