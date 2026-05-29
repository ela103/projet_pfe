from django.urls import path
from .views import CustomLoginView, CustomLogoutView, api_login,api_logout,api_me,api_change_password

urlpatterns = [
    path("login/", CustomLoginView.as_view(), name="login"),
    path("logout/", CustomLogoutView.as_view(), name="logout"),
    path("api/login/", api_login, name="api_login"),
    path("api/logout/", api_logout, name="api_logout"),
    path("api/me/", api_me, name="api_me"),
    path("api/change-password/", api_change_password, name="api_change_password"),
]