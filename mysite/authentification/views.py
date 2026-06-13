import json
import re

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.views import LoginView, LogoutView
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import JsonResponse
from django.urls import reverse_lazy
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import Group
from django.views.decorators.http import (
    require_GET,
    require_POST,
    require_http_methods,
)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .formulaires import EmailAuthenticationForm
from .models import User, PasswordResetOTP
import secrets

from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import PasswordResetOTP

NAME_REGEX = re.compile(r"^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$")
PHONE_REGEX = re.compile(r"^\d{8}$")
PASSWORD_REGEX = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$"
)


def normalize_email(email):
    return email.strip().lower()


def validate_name(value, field_name):
    value = value.strip()

    if len(value) < 2 or len(value) > 25:
        return f"Le {field_name} doit contenir entre 2 et 25 caractères."

    if not NAME_REGEX.fullmatch(value):
        return (
            f"Le {field_name} doit contenir uniquement des lettres, "
            "des espaces, des apostrophes ou des tirets."
        )

    return None


def validate_phone_number(phone_number):
    if not PHONE_REGEX.fullmatch(phone_number):
        return "Le numéro de téléphone doit contenir exactement 8 chiffres."

    return None


def validate_password_strength(password):
    if not PASSWORD_REGEX.fullmatch(password):
        return (
            "Le mot de passe doit contenir au moins 8 caractères, "
            "une majuscule, une minuscule, un chiffre "
            "et un caractère spécial."
        )

    return None


def validate_email_address(email):
    try:
        validate_email(email)
        return None
    except ValidationError:
        return "Veuillez saisir une adresse email valide."

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
                "is_superuser": user.is_superuser,
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
            "is_staff": request.user.is_staff,
            "is_superuser": request.user.is_superuser,
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
def is_staff_user(request):
    """
    Admin principal ou administrateur secondaire.
    Peut consulter les données administratives.
    """
    return (
        request.user.is_authenticated
        and request.user.is_active
        and request.user.is_staff
    )


def is_main_admin(request):
    """
    Seulement l'administrateur principal.
    Peut créer, modifier et supprimer des administrateurs.
    """
    return (
        request.user.is_authenticated
        and request.user.is_active
        and request.user.is_staff
        and request.user.is_superuser
    )
def serialize_user(user):
    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone_number": user.phone_number or "",
        "is_active": user.is_active,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "date_joined": user.date_joined.isoformat(),
    }

@csrf_exempt
@require_POST
def api_forgot_password(request):
    try:
        data = json.loads(request.body or "{}")
        email = data.get("email", "").strip().lower()

        if not email:
            return JsonResponse(
                {
                    "success": False,
                    "message": "L’adresse email est obligatoire.",
                },
                status=400,
            )

        email_error = validate_email_address(email)

        if email_error:
            return JsonResponse(
                {
                    "success": False,
                    "message": email_error,
                },
                status=400,
            )

        try:
            user = User.objects.get(
                email__iexact=email,
                is_active=True,
            )
        except User.DoesNotExist:
            return JsonResponse(
                {
                    "success": False,
                    "message": (
                        "Aucun compte actif n’est associé "
                        "à cette adresse email."
                    ),
                },
                status=404,
            )

        PasswordResetOTP.objects.filter(
            user=user,
            is_used=False,
        ).update(is_used=True)

        code = f"{secrets.randbelow(1_000_000):06d}"

        otp = PasswordResetOTP(
            user=user,
            expires_at=timezone.now() + timedelta(minutes=5),
        )
        otp.set_code(code)
        otp.save()

        send_mail(
            subject="Code de réinitialisation de votre mot de passe",
            message=(
                f"Bonjour {user.first_name or ''},\n\n"
                f"Votre code de vérification est : {code}\n\n"
                "Ce code est valable pendant 5 minutes.\n"
                "Ne communiquez ce code à personne.\n\n"
                "Si vous n’avez pas demandé cette opération, "
                "vous pouvez ignorer ce message."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return JsonResponse(
            {
                "success": True,
                "message": "Le code de vérification a été envoyé.",
            },
            status=200,
        )

    except json.JSONDecodeError:
        return JsonResponse(
            {
                "success": False,
                "message": "Les données JSON sont invalides.",
            },
            status=400,
        )

    except Exception as e:
        print("Erreur envoi OTP :", repr(e))

        return JsonResponse(
            {
                "success": False,
                "message": (
                    "Une erreur est survenue pendant l’envoi "
                    "du code de vérification."
                ),
            },
            status=500,
        )
@csrf_exempt
@require_POST
def api_verify_otp(request):
    try:
        data = json.loads(request.body or "{}")

        email = data.get("email", "").strip().lower()
        code = data.get("code", "").strip()

        if not email or not code:
            return JsonResponse(
                {
                    "success": False,
                    "message": "L’adresse email et le code sont obligatoires.",
                },
                status=400,
            )

        if not re.fullmatch(r"\d{6}", code):
            return JsonResponse(
                {
                    "success": False,
                    "message": "Le code OTP doit contenir exactement 6 chiffres.",
                },
                status=400,
            )

        try:
            user = User.objects.get(
                email__iexact=email,
                is_active=True,
            )
        except User.DoesNotExist:
            return JsonResponse(
                {
                    "success": False,
                    "message": "Code invalide ou expiré.",
                },
                status=400,
            )

        otp = (
            PasswordResetOTP.objects
            .filter(
                user=user,
                is_used=False,
            )
            .order_by("-created_at")
            .first()
        )

        if otp is None:
            return JsonResponse(
                {
                    "success": False,
                    "message": "Code invalide ou expiré.",
                },
                status=400,
            )

        if not otp.is_valid():
            return JsonResponse(
                {
                    "success": False,
                    "message": (
                        "Code invalide, expiré ou nombre "
                        "de tentatives dépassé."
                    ),
                },
                status=400,
            )

        if not otp.check_code(code):
            otp.attempts += 1
            otp.save(update_fields=["attempts"])

            return JsonResponse(
                {
                    "success": False,
                    "message": "Code OTP incorrect.",
                },
                status=400,
            )

        return JsonResponse(
            {
                "success": True,
                "message": "Code OTP vérifié avec succès.",
            }
        )

    except json.JSONDecodeError:
        return JsonResponse(
            {
                "success": False,
                "message": "Les données JSON sont invalides.",
            },
            status=400,
        )

    except Exception as e:
        print("Erreur vérification OTP :", repr(e))

        return JsonResponse(
            {
                "success": False,
                "message": (
                    "Une erreur est survenue pendant "
                    "la vérification du code."
                ),
            },
            status=500,
        )
@csrf_exempt
@require_POST
def api_reset_password(request):
    try:
        data = json.loads(request.body or "{}")

        email = data.get("email", "").strip().lower()
        code = data.get("code", "").strip()
        new_password = data.get("new_password", "")
        confirm_password = data.get("confirm_password", "")

        if not email or not code or not new_password or not confirm_password:
            return JsonResponse(
                {
                    "success": False,
                    "message": "Tous les champs sont obligatoires.",
                },
                status=400,
            )

        if not re.fullmatch(r"\d{6}", code):
            return JsonResponse(
                {
                    "success": False,
                    "message": "Le code OTP doit contenir exactement 6 chiffres.",
                },
                status=400,
            )

        if new_password != confirm_password:
            return JsonResponse(
                {
                    "success": False,
                    "message": "Les deux mots de passe ne correspondent pas.",
                },
                status=400,
            )

        password_error = validate_password_strength(new_password)

        if password_error:
            return JsonResponse(
                {
                    "success": False,
                    "message": password_error,
                },
                status=400,
            )

        try:
            user = User.objects.get(
                email__iexact=email,
                is_active=True,
            )
        except User.DoesNotExist:
            return JsonResponse(
                {
                    "success": False,
                    "message": "Code invalide ou expiré.",
                },
                status=400,
            )

        otp = (
            PasswordResetOTP.objects
            .filter(
                user=user,
                is_used=False,
            )
            .order_by("-created_at")
            .first()
        )

        if otp is None or not otp.is_valid() or not otp.check_code(code):
            return JsonResponse(
                {
                    "success": False,
                    "message": "Code invalide ou expiré.",
                },
                status=400,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])

        otp.is_used = True
        otp.save(update_fields=["is_used"])

        PasswordResetOTP.objects.filter(
            user=user,
            is_used=False,
        ).exclude(id=otp.id).update(is_used=True)

        return JsonResponse(
            {
                "success": True,
                "message": "Mot de passe réinitialisé avec succès.",
            }
        )

    except json.JSONDecodeError:
        return JsonResponse(
            {
                "success": False,
                "message": "Les données JSON sont invalides.",
            },
            status=400,
        )

    except Exception as e:
        print("Erreur réinitialisation mot de passe :", repr(e))

        return JsonResponse(
            {
                "success": False,
                "message": (
                    "Une erreur est survenue pendant "
                    "la réinitialisation du mot de passe."
                ),
            },
            status=500,
        )
@require_GET
def api_admin_list(request):
    if not is_main_admin(request):
        return JsonResponse(
            {
                "success": False,
                "message": "Seul l’administrateur principal peut consulter les comptes administrateurs.",
            },
            status=403,
        )

    admins = User.objects.filter(
        is_staff=True
    ).order_by("-date_joined")

    return JsonResponse(
        {
            "success": True,
            "admins": [
                serialize_user(admin)
                for admin in admins
            ],
        }
    )


@csrf_exempt
@require_POST
def api_admin_create(request):
    # Seul le superuser peut créer un administrateur secondaire
    if not is_main_admin(request):
        return JsonResponse(
            {
                "success": False,
                "message": (
                    "Seul l’administrateur principal peut "
                    "ajouter un administrateur."
                ),
            },
            status=403,
        )

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse(
            {
                "success": False,
                "message": "Les données JSON sont invalides.",
            },
            status=400,
        )

    email = normalize_email(data.get("email", ""))
    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    phone_number = data.get("phone_number", "").strip()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")

    if not all(
        [
            email,
            first_name,
            last_name,
            phone_number,
            password,
            confirm_password,
        ]
    ):
        return JsonResponse(
            {
                "success": False,
                "message": "Veuillez remplir tous les champs obligatoires.",
            },
            status=400,
        )

    first_name_error = validate_name(first_name, "prénom")

    if first_name_error:
        return JsonResponse(
            {
                "success": False,
                "message": first_name_error,
            },
            status=400,
        )

    last_name_error = validate_name(last_name, "nom")

    if last_name_error:
        return JsonResponse(
            {
                "success": False,
                "message": last_name_error,
            },
            status=400,
        )

    email_error = validate_email_address(email)

    if email_error:
        return JsonResponse(
            {
                "success": False,
                "message": email_error,
            },
            status=400,
        )

    phone_error = validate_phone_number(phone_number)

    if phone_error:
        return JsonResponse(
            {
                "success": False,
                "message": phone_error,
            },
            status=400,
        )

    password_error = validate_password_strength(password)

    if password_error:
        return JsonResponse(
            {
                "success": False,
                "message": password_error,
            },
            status=400,
        )

    if password != confirm_password:
        return JsonResponse(
            {
                "success": False,
                "message": "Les deux mots de passe ne correspondent pas.",
            },
            status=400,
        )

    if User.objects.filter(email__iexact=email).exists():
        return JsonResponse(
            {
                "success": False,
                "message": "Un compte avec cet email existe déjà.",
            },
            status=400,
        )

    try:
        # Création d’un admin secondaire, et non d’un superuser
        admin = User.objects.create_user(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        phone_number=phone_number,
        is_staff=True,
        is_active=True,
        is_superuser=False,
    )

        admin_group, created = Group.objects.get_or_create(
            name="Administrateurs secondaires"
        )

        admin.groups.add(admin_group)

        return JsonResponse(
            {
                "success": True,
                "message": "Compte administrateur ajouté avec succès.",
                "admin": serialize_user(admin),
            },
            status=201,
        )

    except Exception as e:
        print("Erreur création administrateur :", repr(e))

        return JsonResponse(
            {
                "success": False,
                "message": (
                    "Une erreur est survenue pendant la création "
                    "du compte administrateur."
                ),
            },
            status=500,
        )

@csrf_exempt
@require_http_methods(["PUT", "PATCH"])
def api_admin_update(request, admin_id):
    if not is_main_admin(request):
        return JsonResponse(
            {
                "success": False,
                "message": "Accès refusé.",
            },
            status=403,
        )

    try:
        admin = User.objects.get(
            id=admin_id,
            is_staff=True,
        )
    except User.DoesNotExist:
        return JsonResponse(
            {
                "success": False,
                "message": "Administrateur introuvable.",
            },
            status=404,
        )

    # AJOUTEZ LA VÉRIFICATION ICI
    if admin.is_superuser and admin.id != request.user.id:
        return JsonResponse(
            {
                "success": False,
                "message": "Vous ne pouvez pas modifier un autre superutilisateur.",
            },
            status=403,
        )

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse(
            {
                "success": False,
                "message": "Les données JSON sont invalides.",
            },
            status=400,
        )

    email = normalize_email(data.get("email", ""))
    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    phone_number = data.get("phone_number", "").strip()
    password = data.get("password", "")
    is_active = data.get("is_active", admin.is_active)

    if not email or not first_name or not last_name or not phone_number:
        return JsonResponse(
            {
                "success": False,
                "message": (
                    "Le prénom, le nom, l’email et "
                    "le téléphone sont obligatoires."
                ),
            },
            status=400,
        )

    if not isinstance(is_active, bool):
        return JsonResponse(
            {
                "success": False,
                "message": "La valeur de l’état du compte est invalide.",
            },
            status=400,
        )

    first_name_error = validate_name(first_name, "prénom")

    if first_name_error:
        return JsonResponse(
            {
                "success": False,
                "message": first_name_error,
            },
            status=400,
        )

    last_name_error = validate_name(last_name, "nom")

    if last_name_error:
        return JsonResponse(
            {
                "success": False,
                "message": last_name_error,
            },
            status=400,
        )

    email_error = validate_email_address(email)

    if email_error:
        return JsonResponse(
            {
                "success": False,
                "message": email_error,
            },
            status=400,
        )

    phone_error = validate_phone_number(phone_number)

    if phone_error:
        return JsonResponse(
            {
                "success": False,
                "message": phone_error,
            },
            status=400,
        )

    email_exists = User.objects.filter(
        email__iexact=email
    ).exclude(
        id=admin.id
    ).exists()

    if email_exists:
        return JsonResponse(
            {
                "success": False,
                "message": "Cet email est déjà utilisé par un autre compte.",
            },
            status=400,
        )

    if admin.id == request.user.id and is_active is False:
        return JsonResponse(
            {
                "success": False,
                "message": "Vous ne pouvez pas désactiver votre propre compte.",
            },
            status=400,
        )

    if password:
        password_error = validate_password_strength(password)

        if password_error:
            return JsonResponse(
                {
                    "success": False,
                    "message": password_error,
                },
                status=400,
            )

    admin.email = email
    admin.first_name = first_name
    admin.last_name = last_name
    admin.phone_number = phone_number
    admin.is_active = is_active
    admin.is_staff = True

    if not admin.is_superuser:
        admin.is_superuser = False

    if password:
        admin.set_password(password)

    admin.save()

    if password:
        admin.set_password(password)

    try:
        admin.save()

        return JsonResponse(
            {
                "success": True,
                "message": "Compte administrateur modifié avec succès.",
                "admin": serialize_user(admin),
            }
        )

    except Exception as e:
        print("Erreur envoi OTP :", repr(e))
        return JsonResponse(
            {
                "success": False,
                "message": (
                    "Une erreur est survenue pendant la modification "
                    "du compte administrateur."
                ),
            },
            status=500,
        )
@csrf_exempt
@require_http_methods(["DELETE"])
def api_admin_delete(request, admin_id):
    if not is_main_admin(request):
        return JsonResponse(
            {
                "success": False,
                "message": "Accès refusé.",
            },
            status=403,
        )

    try:
        admin = User.objects.get(
            id=admin_id,
            is_staff=True,
        )
    except User.DoesNotExist:
        return JsonResponse(
            {
                "success": False,
                "message": "Administrateur introuvable.",
            },
            status=404,
        )

    if admin.id == request.user.id:
        return JsonResponse(
            {
                "success": False,
                "message": "Vous ne pouvez pas supprimer votre propre compte.",
            },
            status=400,
        )

    try:
        if admin.is_superuser:
            return JsonResponse(
                {
                    "success": False,
                    "message": "Le compte administrateur principal ne peut pas être supprimé.",
                },
                status=403,
            )
        admin.delete()

        return JsonResponse(
            {
                "success": True,
                "message": "Compte administrateur supprimé avec succès.",
            }
        )

    except Exception as e:
        print("Erreur envoi OTP :", repr(e))
        return JsonResponse(
            {
                "success": False,
                "message": (
                    "Une erreur est survenue pendant la suppression "
                    "du compte administrateur."
                ),
            },
            status=500,
        )
    
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
from django.views.decorators.csrf import ensure_csrf_cookie


@ensure_csrf_cookie
@require_GET
def api_csrf(request):
    return JsonResponse({
        "success": True,
        "message": "Cookie CSRF initialisé.",
    })