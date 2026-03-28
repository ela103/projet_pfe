import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.auth.views import LoginView, LogoutView
from django.urls import reverse_lazy
from .formulaires import EmailAuthenticationForm
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth import logout


class CustomLoginView(LoginView):
    template_name = "authentification/login.html"
    authentication_form = EmailAuthenticationForm

    def get_success_url(self):
        return reverse_lazy("dashboard")

@method_decorator(csrf_exempt, name='dispatch')
class CustomLogoutView(LogoutView):
    next_page = reverse_lazy("login")

@csrf_exempt
@require_POST
def api_login(request):
    try:
        data = json.loads(request.body)
        email = data.get("email")
        password = data.get("password")
    except json.JSONDecodeError:
        return JsonResponse(
            {"success": False, "message": "Données invalides."},
            status=400
        )

    user = authenticate(request, username=email, password=password)

    if user is not None and user.is_active:
        login(request, user)
        return JsonResponse(
            {
                "success": True,
                "message": "Connexion réussie.",
                "redirect": "/dashboard/"
            }
        )

    return JsonResponse(
        {"success": False, "message": "Email ou mot de passe incorrect."},
        status=401
    )
@csrf_exempt
@require_POST
def api_logout(request):
    logout(request)
    return JsonResponse({
        "success": True,
        "message": "Déconnexion réussie."
    })