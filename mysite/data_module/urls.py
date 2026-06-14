# data_module/urls.py
from django.urls import path
from . import views
from .views import scrape_pages
from .views import scrape_pages, crawl_website ,get_scraped_pages

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
    path("ga4/realtime/", views.ga4_realtime, name="ga4_realtime"),
    path("dashboard/stats/", views.dashboard_stats, name="dashboard_stats"),
    path("dashboard/gsc-pages/", views.gsc_page_distribution, name="gsc_page_distribution"),
    path("ga4/events/import/", views.import_ga_events, name="import_ga_events"),
    path("dashboard/ga-events/", views.ga_events_chart, name="ga_events_chart"),
    path("scrape-pages/", scrape_pages, name="scrape_pages"),
    path("crawl-website/", crawl_website, name="crawl_website"),
    path("scraped-pages/", get_scraped_pages, name="get_scraped_pages"),
    path("websites/", views.websites_list, name="websites_list"),
    path("top-pages/", views.top_pages, name="top_pages"),
    path("top-keywords/", views.top_keywords, name="top_keywords"),
    path("notifications/", views.notifications_list, name="notifications_list"),
    path("websites/add/", views.add_website, name="add_website"),
    path("websites/<int:website_id>/",views.website_detail,name="website_detail"),
    path("dashboard/events/", views.dashboard_events, name="dashboard_events"),
    path("top-visited-pages/", views.top_visited_pages, name="top_visited_pages"),



    path("dashboard/stats-dw/",views.dashboard_stats_dw,name="dashboard_stats_dw"),
    path("top-visited-pages-dw/",views.top_visited_pages_dw,name="top_visited_pages_dw"),
    path("top-pages-dw/",views.top_pages_dw,name="top_pages_dw"),
    path("top-keywords-dw/",views.top_keywords_dw,name="top_keywords_dw"),
    path("dashboard/events-dw/",views.dashboard_events_dw,name="dashboard_events_dw"),
    path("dashboard/ga-events-dw/",views.ga_events_chart_dw,name="ga_events_chart_dw"),
    path("dashboard/gsc-pages-dw/",views.gsc_page_distribution_dw,name="gsc_page_distribution_dw"),
    path("notifications/<int:notification_id>/read/",views.mark_notification_read,name="mark_notification_read"),
]