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
def api_me(request):
    if request.user.is_authenticated:
        return JsonResponse({
            "authenticated": True,
            "id": request.user.id,
            "email": request.user.email,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
            "phone_number": request.user.phone_number,
        })

    return JsonResponse({
        "authenticated": False
    }, status=401)
@csrf_exempt
@require_POST
def api_change_password(request):
    if not request.user.is_authenticated:
        return JsonResponse({
            "success": False,
            "message": "Utilisateur non authentifié."
        }, status=401)

    try:
        data = json.loads(request.body)

        old_password = data.get("old_password")
        new_password = data.get("new_password")
        confirm_password = data.get("confirm_password")

        if not old_password or not new_password or not confirm_password:
            return JsonResponse({
                "success": False,
                "message": "Tous les champs sont obligatoires."
            }, status=400)

        if not request.user.check_password(old_password):
            return JsonResponse({
                "success": False,
                "message": "L'ancien mot de passe est incorrect."
            }, status=400)

        if new_password != confirm_password:
            return JsonResponse({
                "success": False,
                "message": "Les deux nouveaux mots de passe ne correspondent pas."
            }, status=400)

        if len(new_password) < 8:
            return JsonResponse({
                "success": False,
                "message": "Le nouveau mot de passe doit contenir au moins 8 caractères."
            }, status=400)

        request.user.set_password(new_password)
        request.user.save()

        logout(request)

        return JsonResponse({
            "success": True,
            "message": "Mot de passe modifié avec succès. Veuillez vous reconnecter."
        })

    except json.JSONDecodeError:
        return JsonResponse({
            "success": False,
            "message": "JSON invalide."
        }, status=400)

    except Exception as e:
        return JsonResponse({
            "success": False,
            "message": str(e)
        }, status=500)