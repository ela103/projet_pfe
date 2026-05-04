from django.urls import path
from .views import gemini_test, analyze_stats, seo_global_insight,chatbot_api

urlpatterns = [
    path("test/", gemini_test, name="gemini_test"),
    path("analyze/", analyze_stats, name="analyze_stats"),
    path("seo-global-insight/", seo_global_insight, name="seo_global_insight"),
    path("chatbot/", chatbot_api, name="chatbot_api"),
]