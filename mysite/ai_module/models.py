from django.conf import settings
from django.db import models

from data_module.models import Website


class AIRecommendation(models.Model):
    STATUS_CHOICES = [
        ("new", "Nouvelle"),
        ("in_progress", "En cours"),
        ("done", "Faite"),
        ("ignored", "Ignoree"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ai_recommendations",
    )
    website = models.ForeignKey(
        Website,
        on_delete=models.CASCADE,
        related_name="ai_recommendations",
    )

    tool = models.CharField(max_length=80, default="recommendations")
    period = models.CharField(max_length=30, default="all")
    question = models.TextField(blank=True)
    content = models.TextField()
    source = models.CharField(max_length=80, blank=True, default="")
    used_rag = models.BooleanField(default=False)
    retrieved_documents_count = models.PositiveIntegerField(default=0)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="new",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ai_recommendations"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["website", "period", "tool"]),
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.website.name} - {self.period} - {self.status}"


class AIChatMessage(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_chat_messages",
    )
    website = models.ForeignKey(
        Website,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ai_chat_messages",
    )

    question = models.TextField()
    answer = models.TextField()
    intent = models.CharField(max_length=80, blank=True, default="")
    source = models.CharField(max_length=80, blank=True, default="")
    used_rag = models.BooleanField(default=False)
    retrieved_documents_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_chat_messages"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["website", "created_at"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.created_at:%Y-%m-%d %H:%M}"
