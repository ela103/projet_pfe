from django.urls import path
from . import views

urlpatterns = [
    path('test/', views.test_ai, name='test_ai'),
    path('chat/', views.ai_chat, name='ai_chat'),
    path("weekly-summary/", views.weekly_seo_summary, name="weekly_seo_summary"),
    path("export-global-analysis-pdf/", views.export_global_analysis_pdf,name="export_global_analysis_pdf"),

]
