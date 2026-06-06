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
from django.views.decorators.http import require_http_methods, require_GET
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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
        email = data.get("email", "").strip()
        password = data.get("password", "")
    except json.JSONDecodeError:
        return JsonResponse(
            {
                "success": False,
                "message": "Données invalides.",
            },
            status=400,
        )

    if not email or not password:
        return JsonResponse(
            {
                "success": False,
                "message": "L’email et le mot de passe sont obligatoires.",
            },
            status=400,
        )

    user = authenticate(
        request,
        username=email,
        password=password,
    )

    if user is None or not user.is_active:
        return JsonResponse(
            {
                "success": False,
                "message": "Email ou mot de passe incorrect.",
            },
            status=401,
        )

    # Crée la session Django
    login(request, user)

    # Crée aussi les jetons JWT
    refresh = RefreshToken.for_user(user)

    return JsonResponse(
        {
            "success": True,
            "message": "Connexion réussie.",
            "redirect": "/dashboard/",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_staff": user.is_staff,
            },
        }
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
def is_admin_user(request):
    return request.user.is_authenticated and request.user.is_staff


def serialize_user(user):
    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone_number": user.phone_number,
        "is_active": user.is_active,
        "is_staff": user.is_staff,
        "date_joined": user.date_joined.strftime("%Y-%m-%d %H:%M"),
    }


@require_GET
def api_admin_list(request):
    if not is_admin_user(request):
        return JsonResponse({
            "success": False,
            "message": "Accès refusé."
        }, status=403)

    admins = User.objects.filter(is_staff=True).order_by("-id")

    return JsonResponse({
        "success": True,
        "admins": [serialize_user(admin) for admin in admins]
    })


@csrf_exempt
@require_POST
def api_admin_create(request):
    if not is_admin_user(request):
        return JsonResponse({
            "success": False,
            "message": "Accès refusé."
        }, status=403)

    try:
        data = json.loads(request.body)

        email = data.get("email", "").strip()
        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()
        phone_number = data.get("phone_number", "").strip()
        password = data.get("password", "")

        if not email or not first_name or not last_name or not password:
            return JsonResponse({
                "success": False,
                "message": "Email, prénom, nom et mot de passe sont obligatoires."
            }, status=400)

        if len(password) < 8:
            return JsonResponse({
                "success": False,
                "message": "Le mot de passe doit contenir au moins 8 caractères."
            }, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse({
                "success": False,
                "message": "Un compte avec cet email existe déjà."
            }, status=400)

        admin = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            is_staff=True,
            is_active=True,
        )

        return JsonResponse({
            "success": True,
            "message": "Compte administrateur ajouté avec succès.",
            "admin": serialize_user(admin)
        }, status=201)

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


@csrf_exempt
@require_http_methods(["PUT", "PATCH"])
def api_admin_update(request, admin_id):
    if not is_admin_user(request):
        return JsonResponse({
            "success": False,
            "message": "Accès refusé."
        }, status=403)

    try:
        admin = User.objects.get(id=admin_id, is_staff=True)

        data = json.loads(request.body)

        email = data.get("email", "").strip()
        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()
        phone_number = data.get("phone_number", "").strip()
        password = data.get("password", "")
        is_active = data.get("is_active", admin.is_active)

        if not email or not first_name or not last_name:
            return JsonResponse({
                "success": False,
                "message": "Email, prénom et nom sont obligatoires."
            }, status=400)

        if User.objects.filter(email=email).exclude(id=admin.id).exists():
            return JsonResponse({
                "success": False,
                "message": "Cet email est déjà utilisé par un autre compte."
            }, status=400)

        admin.email = email
        admin.first_name = first_name
        admin.last_name = last_name
        admin.phone_number = phone_number
        admin.is_active = is_active
        admin.is_staff = True

        if password:
            if len(password) < 8:
                return JsonResponse({
                    "success": False,
                    "message": "Le mot de passe doit contenir au moins 8 caractères."
                }, status=400)
            admin.set_password(password)

        admin.save()

        return JsonResponse({
            "success": True,
            "message": "Compte administrateur modifié avec succès.",
            "admin": serialize_user(admin)
        })

    except User.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "Administrateur introuvable."
        }, status=404)

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


@csrf_exempt
@require_http_methods(["DELETE"])
def api_admin_delete(request, admin_id):
    if not is_admin_user(request):
        return JsonResponse({
            "success": False,
            "message": "Accès refusé."
        }, status=403)

    try:
        admin = User.objects.get(id=admin_id, is_staff=True)

        if admin.id == request.user.id:
            return JsonResponse({
                "success": False,
                "message": "Vous ne pouvez pas supprimer votre propre compte."
            }, status=400)

        admin.delete()

        return JsonResponse({
            "success": True,
            "message": "Compte administrateur supprimé avec succès."
        })

    except User.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "Administrateur introuvable."
        }, status=404)

    except Exception as e:
        return JsonResponse({
            "success": False,
            "message": str(e)
        }, status=500)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def jwt_test(request):
    return Response({
        "success": True,
        "message": "JWT valide.",
        "user": {
            "id": request.user.id,
            "email": request.user.email,
            "is_staff": request.user.is_staff,
            "is_active": request.user.is_active,
        }
    })