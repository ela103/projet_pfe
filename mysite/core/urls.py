from django.urls import path
from .views import dashboard
from .views import admin_home


urlpatterns = [
    path("dashboard/", dashboard, name="dashboard"),
    path("admin-home/", admin_home, name="admin_home"),
]