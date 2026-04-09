from django.urls import path
from .views import CustomLoginView, CustomLogoutView, api_login,api_logout,api_me

urlpatterns = [
    path("login/", CustomLoginView.as_view(), name="login"),
    path("logout/", CustomLogoutView.as_view(), name="logout"),
    path("api/login/", api_login, name="api_login"),
    path("api/logout/", api_logout, name="api_logout"),
    path("api/me/", api_me, name="api_me"),
]