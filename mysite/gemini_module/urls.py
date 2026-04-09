from django.urls import path
from .views import gemini_test, analyze_stats

urlpatterns = [
    path("test/", gemini_test),
    path("analyze/", analyze_stats, name="gemini_analyze"),
]