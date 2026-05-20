from django.urls import path

from . import views


urlpatterns = [
    path("keywords/", views.keywords_list, name="competitor_keywords"),
    path("competitors/", views.competitors_list, name="competitors_list"),
    path("serp-results/", views.serp_results_list, name="serp_results_list"),
    path("scraped-pages/", views.scraped_pages_list, name="scraped_pages_list"),
    path("traffic-estimates/", views.traffic_estimates_list, name="traffic_estimates_list"),
    path("top-competitors/", views.top_competitors_by_keyword, name="top_competitors_by_keyword"),
]