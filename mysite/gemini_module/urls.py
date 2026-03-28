from django.urls import path
from .views import gemini_test

urlpatterns = [
    path("test/", gemini_test),
]