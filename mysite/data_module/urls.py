# data_module/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("ga4/test/", views.ga4_test, name="ga4_test"),
    path("gsc/test/", views.gsc_test, name="gsc_test"),
    path("gsc/daily/", views.gsc_daily, name="gsc_daily"),

    path("login/google/", views.google_login, name="google_login"),
    path("oauth2/callback/", views.oauth2_callback, name="oauth2_callback"),

    path("ga4-dashboard/", views.ga4_dashboard, name="ga4_dashboard"),
    path("gsc/", views.gsc_dashboard, name="gsc_dashboard"),
    path("test-gsc/", views.test_gsc, name="test_gsc"),
    path("import/", views.import_metrics, name="import_metrics"),
]