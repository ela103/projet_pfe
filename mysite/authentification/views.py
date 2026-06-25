import json
import re
from urllib.parse import urlencode

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.views import LoginView, LogoutView
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import JsonResponse,HttpResponse
from django.shortcuts import redirect
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
from .models import (
    User,
    PasswordResetOTP,
    PasskeyCredential,
)
import secrets

from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import PasswordResetOTP
from django.conf import settings

from webauthn import (
    generate_registration_options,
    options_to_json,
    verify_registration_response,
)
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    PublicKeyCredentialDescriptor,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)
from webauthn import (
    generate_registration_options,
    generate_authentication_options,
    options_to_json,
    verify_registration_response,
    verify_authentication_response,
)
import requests

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
        profile_photo_url = ""
        if request.user.profile_photo:
            profile_photo_url = request.build_absolute_uri(
                request.user.profile_photo.url
            )

        return JsonResponse({
            "authenticated": True,
            "id": request.user.id,
            "email": request.user.email,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
            "phone_number": request.user.phone_number,
            "profile_photo_url": profile_photo_url,
            "is_staff": request.user.is_staff,
            "is_superuser": request.user.is_superuser,
        })

    return JsonResponse({
        "authenticated": False
    }, status=401)


@csrf_exempt
@require_http_methods(["POST", "DELETE"])
def api_profile_photo(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"success": False, "message": "Utilisateur non authentifié."},
            status=401,
        )

    if request.method == "DELETE":
        current_photo = request.user.profile_photo

        if current_photo:
            current_photo.delete(save=False)
            request.user.profile_photo = None
            request.user.save(update_fields=["profile_photo"])

        return JsonResponse(
            {
                "success": True,
                "message": "Photo de profil supprimée.",
                "profile_photo_url": "",
            }
        )

    photo = request.FILES.get("photo")

    if photo is None:
        return JsonResponse(
            {"success": False, "message": "Veuillez sélectionner une image."},
            status=400,
        )

    if photo.size > 5 * 1024 * 1024:
        return JsonResponse(
            {"success": False, "message": "La photo ne doit pas dépasser 5 Mo."},
            status=400,
        )

    extension = photo.name.rsplit(".", 1)[-1].lower() if "." in photo.name else ""
    allowed_extensions = {"jpg", "jpeg", "png", "webp"}

    if extension not in allowed_extensions:
        return JsonResponse(
            {
                "success": False,
                "message": "Formats autorisés : JPG, PNG et WebP.",
            },
            status=400,
        )

    header = photo.read(12)
    photo.seek(0)
    is_jpeg = header.startswith(b"\xff\xd8\xff")
    is_png = header.startswith(b"\x89PNG\r\n\x1a\n")
    is_webp = header.startswith(b"RIFF") and header[8:12] == b"WEBP"

    if not (is_jpeg or is_png or is_webp):
        return JsonResponse(
            {"success": False, "message": "Le fichier sélectionné n’est pas une image valide."},
            status=400,
        )

    previous_photo = request.user.profile_photo
    request.user.profile_photo = photo
    request.user.save(update_fields=["profile_photo"])

    if previous_photo and previous_photo.name != request.user.profile_photo.name:
        previous_photo.delete(save=False)

    return JsonResponse(
        {
            "success": True,
            "message": "Photo de profil mise à jour.",
            "profile_photo_url": request.build_absolute_uri(
                request.user.profile_photo.url
            ),
        }
    )



@csrf_exempt
@require_POST
def api_passkey_register_options(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {
                "success": False,
                "message": "Utilisateur non authentifié.",
            },
            status=401,
        )

    try:
        user = request.user

        existing_credentials = [
            PublicKeyCredentialDescriptor(
                id=bytes(credential.credential_id),
                transports=credential.transports or None,
            )
            for credential in user.passkey_credentials.all()
        ]

        options = generate_registration_options(
            rp_id=settings.WEBAUTHN_RP_ID,
            rp_name=settings.WEBAUTHN_RP_NAME,
            user_id=str(user.id).encode("utf-8"),
            user_name=user.email,
            user_display_name=(
                f"{user.first_name} {user.last_name}".strip()
                or user.email
            ),
            exclude_credentials=existing_credentials,
            authenticator_selection=AuthenticatorSelectionCriteria(
                resident_key=ResidentKeyRequirement.PREFERRED,
                user_verification=UserVerificationRequirement.REQUIRED,
            ),
        )

        # Le challenge doit être conservé côté serveur pour la vérification.
        request.session["passkey_registration_challenge"] = (
            options.challenge.hex()
        )

        request.session.modified = True

        return HttpResponse(
            options_to_json(options),
            content_type="application/json",
        )

    except Exception as error:
        print("Erreur options inscription passkey :", repr(error))

        return JsonResponse(
            {
                "success": False,
                "message": (
                    "Impossible de préparer l’enregistrement "
                    "de la passkey."
                ),
            },
            status=500,
        )
    

@csrf_exempt
@require_POST
def api_passkey_register_verify(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {
                "success": False,
                "message": "Utilisateur non authentifié.",
            },
            status=401,
        )

    try:
        data = json.loads(request.body or "{}")

        credential = data.get("credential")
        device_name = str(
            data.get("device_name", "Cet appareil")
        ).strip()

        if not credential:
            return JsonResponse(
                {
                    "success": False,
                    "message": (
                        "La réponse d’enregistrement "
                        "WebAuthn est absente."
                    ),
                },
                status=400,
            )

        challenge_hex = request.session.get(
            "passkey_registration_challenge"
        )

        if not challenge_hex:
            return JsonResponse(
                {
                    "success": False,
                    "message": (
                        "Le challenge d’enregistrement "
                        "est absent ou expiré."
                    ),
                },
                status=400,
            )

        expected_challenge = bytes.fromhex(challenge_hex)

        verification = verify_registration_response(
            credential=credential,
            expected_challenge=expected_challenge,
            expected_origin=settings.WEBAUTHN_ORIGIN,
            expected_rp_id=settings.WEBAUTHN_RP_ID,
            require_user_verification=True,
        )

        credential_id = verification.credential_id

        if PasskeyCredential.objects.filter(
            credential_id=credential_id,
        ).exists():
            request.session.pop(
                "passkey_registration_challenge",
                None,
            )

            return JsonResponse(
                {
                    "success": False,
                    "message": (
                        "Cette passkey est déjà enregistrée."
                    ),
                },
                status=409,
            )

        transports = (
            credential
            .get("response", {})
            .get("transports", [])
        )

        saved_credential = PasskeyCredential.objects.create(
            user=request.user,
            credential_id=credential_id,
            public_key=verification.credential_public_key,
            sign_count=verification.sign_count,
            transports=transports,
            device_name=device_name or "Cet appareil",
        )

        # Le challenge ne doit pas pouvoir être réutilisé.
        request.session.pop(
            "passkey_registration_challenge",
            None,
        )
        request.session.modified = True

        return JsonResponse(
            {
                "success": True,
                "message": (
                    "La connexion avec cet appareil "
                    "a été activée avec succès."
                ),
                "passkey": {
                    "id": saved_credential.id,
                    "device_name": saved_credential.device_name,
                    "created_at": (
                        saved_credential.created_at.isoformat()
                    ),
                },
            },
            status=201,
        )

    except json.JSONDecodeError:
        return JsonResponse(
            {
                "success": False,
                "message": "Les données JSON sont invalides.",
            },
            status=400,
        )

    except ValueError:
        return JsonResponse(
            {
                "success": False,
                "message": (
                    "Le challenge d’enregistrement "
                    "est invalide."
                ),
            },
            status=400,
        )

    except Exception as error:
        print(
            "Erreur vérification inscription passkey :",
            repr(error),
        )

        return JsonResponse(
            {
                "success": False,
                "message": (
                    "La vérification de la passkey a échoué. "
                    "Vérifiez l’origine et réessayez."
                ),
            },
            status=400,
        )
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
@require_POST
def api_passkey_login_options(request):
    try:
        data = json.loads(request.body or "{}")
        email = data.get("email", "").strip().lower()

        if not email:
            return JsonResponse(
                {
                    "success": False,
                    "message": (
                        "Saisissez votre adresse email avant "
                        "d’utiliser la connexion avec cet appareil."
                    ),
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
                        "Aucune passkey disponible pour ce compte."
                    ),
                },
                status=400,
            )

        passkeys = user.passkey_credentials.all()

        if not passkeys.exists():
            return JsonResponse(
                {
                    "success": False,
                    "message": (
                        "Aucune connexion par passkey n’est "
                        "activée pour ce compte."
                    ),
                },
                status=400,
            )

        allowed_credentials = [
            PublicKeyCredentialDescriptor(
                id=bytes(passkey.credential_id),
            )
            for passkey in passkeys
        ]

        options = generate_authentication_options(
            rp_id=settings.WEBAUTHN_RP_ID,
            allow_credentials=allowed_credentials,
            user_verification=UserVerificationRequirement.REQUIRED,
        )

        request.session["passkey_login_challenge"] = (
            options.challenge.hex()
        )
        request.session["passkey_login_user_id"] = user.id
        request.session.modified = True

        return HttpResponse(
            options_to_json(options),
            content_type="application/json",
        )

    except json.JSONDecodeError:
        return JsonResponse(
            {
                "success": False,
                "message": "Les données JSON sont invalides.",
            },
            status=400,
        )

    except Exception as error:
        print(
            "Erreur options connexion passkey :",
            repr(error),
        )

        return JsonResponse(
            {
                "success": False,
                "message": (
                    "Impossible de préparer la connexion "
                    "avec cet appareil."
                ),
            },
            status=500,
        )

@csrf_exempt
@require_POST
def api_passkey_login_verify(request):
    try:
        data = json.loads(request.body or "{}")
        credential = data.get("credential")

        if not credential:
            return JsonResponse(
                {
                    "success": False,
                    "message": "La réponse WebAuthn est absente.",
                },
                status=400,
            )

        challenge_hex = request.session.get(
            "passkey_login_challenge"
        )
        user_id = request.session.get(
            "passkey_login_user_id"
        )

        if not challenge_hex or not user_id:
            return JsonResponse(
                {
                    "success": False,
                    "message": (
                        "La demande de connexion est absente "
                        "ou expirée."
                    ),
                },
                status=400,
            )

        try:
            user = User.objects.get(
                id=user_id,
                is_active=True,
            )
        except User.DoesNotExist:
            return JsonResponse(
                {
                    "success": False,
                    "message": "Utilisateur introuvable.",
                },
                status=404,
            )

        credential_id_text = credential.get("id", "")

        if not credential_id_text:
            return JsonResponse(
                {
                    "success": False,
                    "message": (
                        "L’identifiant de la passkey est absent."
                    ),
                },
                status=400,
            )

        # Recherche de la passkey parmi celles de l’utilisateur.
        # La vérification finale est effectuée cryptographiquement
        # par verify_authentication_response.
        registered_passkey = None

        for passkey in user.passkey_credentials.all():
            import base64

            stored_id = bytes(passkey.credential_id)

            encoded_id = (
                base64.urlsafe_b64encode(stored_id)
                .rstrip(b"=")
                .decode("ascii")
            )

            if encoded_id == credential_id_text:
                registered_passkey = passkey
                break

        if registered_passkey is None:
            return JsonResponse(
                {
                    "success": False,
                    "message": (
                        "Cette passkey n’est pas associée "
                        "à ce compte."
                    ),
                },
                status=404,
            )

        verification = verify_authentication_response(
            credential=credential,
            expected_challenge=bytes.fromhex(
                challenge_hex
            ),
            expected_rp_id=settings.WEBAUTHN_RP_ID,
            expected_origin=settings.WEBAUTHN_ORIGIN,
            credential_public_key=bytes(
                registered_passkey.public_key
            ),
            credential_current_sign_count=(
                registered_passkey.sign_count
            ),
            require_user_verification=True,
        )

        registered_passkey.sign_count = (
            verification.new_sign_count
        )
        registered_passkey.last_used_at = timezone.now()
        registered_passkey.save(
            update_fields=[
                "sign_count",
                "last_used_at",
            ]
        )

        # Même résultat que la connexion normale
        login(request, user)

        refresh = RefreshToken.for_user(user)

        request.session.pop(
            "passkey_login_challenge",
            None,
        )
        request.session.pop(
            "passkey_login_user_id",
            None,
        )
        request.session.modified = True

        return JsonResponse(
            {
                "success": True,
                "message": (
                    "Connexion avec cet appareil réussie."
                ),
                "redirect": "/dashboard",
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

    except json.JSONDecodeError:
        return JsonResponse(
            {
                "success": False,
                "message": "Les données JSON sont invalides.",
            },
            status=400,
        )

    except Exception as error:
        print(
            "Erreur connexion passkey :",
            repr(error),
        )

        return JsonResponse(
            {
                "success": False,
                "message": (
                    "La connexion avec cet appareil a échoué."
                ),
            },
            status=400,
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


def build_frontend_url(path, query=None):
    frontend_url = getattr(
        settings,
        "FRONTEND_URL",
        "http://127.0.0.1:3000",
    ).rstrip("/")

    target_url = f"{frontend_url}{path}"

    if query:
        target_url = f"{target_url}?{urlencode(query)}"

    return target_url


def redirect_to_oauth_error(message):
    return redirect(
        build_frontend_url(
            "/auth/oauth/callback",
            {"error": message},
        )
    )


def get_or_create_oauth_user(email, first_name="", last_name="", provider="OAuth"):
    normalized_email = normalize_email(email)

    try:
        return User.objects.get(email__iexact=normalized_email)
    except User.DoesNotExist:
        pass

    if not first_name:
        first_name = normalized_email.split("@", 1)[0][:25] or "Utilisateur"

    user = User.objects.create_user(
        email=normalized_email,
        password=None,
        first_name=first_name[:25],
        last_name=(last_name or provider)[:25],
        is_active=True,
    )

    return user


@require_GET
def google_oauth_start(request):
    google_client_id = getattr(settings, "GOOGLE_CLIENT_ID", "")
    google_redirect_uri = getattr(
        settings,
        "GOOGLE_REDIRECT_URI",
        "http://127.0.0.1:8000/api/oauth/google/callback/",
    )

    if not google_client_id:
        return redirect_to_oauth_error(
            "La connexion Google n'est pas configurée."
        )

    state = secrets.token_urlsafe(32)
    request.session["google_oauth_state"] = state
    request.session.modified = True

    params = {
        "client_id": google_client_id,
        "redirect_uri": google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
    }

    return redirect(
        "https://accounts.google.com/o/oauth2/v2/auth?"
        + urlencode(params)
    )


@require_GET
def google_oauth_callback(request):
    google_client_id = getattr(settings, "GOOGLE_CLIENT_ID", "")
    google_client_secret = getattr(settings, "GOOGLE_CLIENT_SECRET", "")
    google_redirect_uri = getattr(
        settings,
        "GOOGLE_REDIRECT_URI",
        "http://127.0.0.1:8000/api/oauth/google/callback/",
    )

    error = request.GET.get("error")

    if error:
        return redirect_to_oauth_error(
            "La connexion Google a été annulée."
        )

    state = request.GET.get("state", "")
    expected_state = request.session.get("google_oauth_state")

    if not expected_state or state != expected_state:
        return redirect_to_oauth_error(
            "La session Google est invalide ou expirée."
        )

    code = request.GET.get("code")

    if not code:
        return redirect_to_oauth_error(
            "Google n'a pas retourné de code de connexion."
        )

    try:
        token_response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": google_client_id,
                "client_secret": google_client_secret,
                "redirect_uri": google_redirect_uri,
                "grant_type": "authorization_code",
            },
            timeout=12,
        )
        token_response.raise_for_status()

        access_token = token_response.json().get("access_token")

        if not access_token:
            return redirect_to_oauth_error(
                "Google n'a pas retourné de jeton d'accès."
            )

        userinfo_response = requests.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=12,
        )
        userinfo_response.raise_for_status()

        profile = userinfo_response.json()
        email = profile.get("email", "")

        if not email or not profile.get("email_verified", False):
            return redirect_to_oauth_error(
                "L'email Google n'est pas vérifié."
            )

        user = get_or_create_oauth_user(
            email=email,
            first_name=profile.get("given_name", ""),
            last_name=profile.get("family_name", ""),
        )

        if not user.is_active:
            return redirect_to_oauth_error(
                "Ce compte est désactivé."
            )

        login(request, user)

        refresh = RefreshToken.for_user(user)

        request.session.pop("google_oauth_state", None)
        request.session.modified = True

        return redirect(
            build_frontend_url(
                "/auth/oauth/callback",
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            )
        )

    except requests.RequestException as error:
        print("Erreur OAuth Google :", repr(error))

        return redirect_to_oauth_error(
            "Impossible de valider la connexion Google."
        )

    except Exception as error:
        print("Erreur callback Google :", repr(error))

        return redirect_to_oauth_error(
            "Une erreur est survenue pendant la connexion Google."
        )


def get_primary_github_email(access_token):
    emails_response = requests.get(
        "https://api.github.com/user/emails",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
        },
        timeout=12,
    )
    emails_response.raise_for_status()

    emails = emails_response.json()

    for email_data in emails:
        if email_data.get("primary") and email_data.get("verified"):
            return email_data.get("email", "")

    for email_data in emails:
        if email_data.get("verified"):
            return email_data.get("email", "")

    return ""


@require_GET
def github_oauth_start(request):
    github_client_id = getattr(settings, "GITHUB_CLIENT_ID", "")
    github_redirect_uri = getattr(
        settings,
        "GITHUB_REDIRECT_URI",
        "http://127.0.0.1:8000/api/oauth/github/callback/",
    )

    if not github_client_id:
        return redirect_to_oauth_error(
            "La connexion GitHub n'est pas configurée."
        )

    state = secrets.token_urlsafe(32)
    request.session["github_oauth_state"] = state
    request.session.modified = True

    params = {
        "client_id": github_client_id,
        "redirect_uri": github_redirect_uri,
        "scope": "read:user user:email",
        "state": state,
        "allow_signup": "true",
    }

    return redirect(
        "https://github.com/login/oauth/authorize?"
        + urlencode(params)
    )


@require_GET
def github_oauth_callback(request):
    github_client_id = getattr(settings, "GITHUB_CLIENT_ID", "")
    github_client_secret = getattr(settings, "GITHUB_CLIENT_SECRET", "")
    github_redirect_uri = getattr(
        settings,
        "GITHUB_REDIRECT_URI",
        "http://127.0.0.1:8000/api/oauth/github/callback/",
    )

    error = request.GET.get("error")

    if error:
        return redirect_to_oauth_error(
            "La connexion GitHub a été annulée."
        )

    state = request.GET.get("state", "")
    expected_state = request.session.get("github_oauth_state")

    if not expected_state or state != expected_state:
        return redirect_to_oauth_error(
            "La session GitHub est invalide ou expirée."
        )

    code = request.GET.get("code")

    if not code:
        return redirect_to_oauth_error(
            "GitHub n'a pas retourné de code de connexion."
        )

    try:
        token_response = requests.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": github_client_id,
                "client_secret": github_client_secret,
                "code": code,
                "redirect_uri": github_redirect_uri,
            },
            headers={"Accept": "application/json"},
            timeout=12,
        )
        token_response.raise_for_status()

        token_data = token_response.json()

        if token_data.get("error"):
            return redirect_to_oauth_error(
                "GitHub a refusé la connexion."
            )

        access_token = token_data.get("access_token")

        if not access_token:
            return redirect_to_oauth_error(
                "GitHub n'a pas retourné de jeton d'accès."
            )

        profile_response = requests.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
            timeout=12,
        )
        profile_response.raise_for_status()

        profile = profile_response.json()
        email = profile.get("email") or get_primary_github_email(access_token)

        if not email:
            return redirect_to_oauth_error(
                "Aucun email vérifié n'est disponible sur ce compte GitHub."
            )

        display_name = profile.get("name") or profile.get("login") or ""
        name_parts = display_name.split(" ", 1)
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        user = get_or_create_oauth_user(
            email=email,
            first_name=first_name,
            last_name=last_name,
            provider="GitHub",
        )

        if not user.is_active:
            return redirect_to_oauth_error(
                "Ce compte est désactivé."
            )

        login(request, user)

        refresh = RefreshToken.for_user(user)

        request.session.pop("github_oauth_state", None)
        request.session.modified = True

        return redirect(
            build_frontend_url(
                "/auth/oauth/callback",
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            )
        )

    except requests.RequestException as error:
        print("Erreur OAuth GitHub :", repr(error))

        return redirect_to_oauth_error(
            "Impossible de valider la connexion GitHub."
        )

    except Exception as error:
        print("Erreur callback GitHub :", repr(error))

        return redirect_to_oauth_error(
            "Une erreur est survenue pendant la connexion GitHub."
        )


@require_GET
def linkedin_oauth_start(request):
    linkedin_client_id = getattr(settings, "LINKEDIN_CLIENT_ID", "")
    linkedin_redirect_uri = getattr(
        settings,
        "LINKEDIN_REDIRECT_URI",
        "http://127.0.0.1:8000/api/oauth/linkedin/callback/",
    )

    if not linkedin_client_id:
        return redirect_to_oauth_error(
            "La connexion LinkedIn n'est pas configurée."
        )

    state = secrets.token_urlsafe(32)
    request.session["linkedin_oauth_state"] = state
    request.session.modified = True

    params = {
        "client_id": linkedin_client_id,
        "redirect_uri": linkedin_redirect_uri,
        "response_type": "code",
        "scope": "openid profile email",
        "state": state,
    }

    return redirect(
        "https://www.linkedin.com/oauth/v2/authorization?"
        + urlencode(params)
    )


@require_GET
def linkedin_oauth_callback(request):
    linkedin_client_id = getattr(settings, "LINKEDIN_CLIENT_ID", "")
    linkedin_client_secret = getattr(settings, "LINKEDIN_CLIENT_SECRET", "")
    linkedin_redirect_uri = getattr(
        settings,
        "LINKEDIN_REDIRECT_URI",
        "http://127.0.0.1:8000/api/oauth/linkedin/callback/",
    )

    error = request.GET.get("error")

    if error:
        return redirect_to_oauth_error(
            "La connexion LinkedIn a été annulée."
        )

    state = request.GET.get("state", "")
    expected_state = request.session.get("linkedin_oauth_state")

    if not expected_state or state != expected_state:
        return redirect_to_oauth_error(
            "La session LinkedIn est invalide ou expirée."
        )

    code = request.GET.get("code")

    if not code:
        return redirect_to_oauth_error(
            "LinkedIn n'a pas retourné de code de connexion."
        )

    try:
        token_response = requests.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "client_id": linkedin_client_id,
                "client_secret": linkedin_client_secret,
                "redirect_uri": linkedin_redirect_uri,
            },
            headers={
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            timeout=12,
        )
        token_response.raise_for_status()

        access_token = token_response.json().get("access_token")

        if not access_token:
            return redirect_to_oauth_error(
                "LinkedIn n'a pas retourné de jeton d'accès."
            )

        userinfo_response = requests.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=12,
        )
        userinfo_response.raise_for_status()

        profile = userinfo_response.json()
        email = profile.get("email", "")

        if not email or profile.get("email_verified") is False:
            return redirect_to_oauth_error(
                "L'email LinkedIn n'est pas disponible ou vérifié."
            )

        user = get_or_create_oauth_user(
            email=email,
            first_name=profile.get("given_name", ""),
            last_name=profile.get("family_name", ""),
            provider="LinkedIn",
        )

        if not user.is_active:
            return redirect_to_oauth_error(
                "Ce compte est désactivé."
            )

        login(request, user)

        refresh = RefreshToken.for_user(user)

        request.session.pop("linkedin_oauth_state", None)
        request.session.modified = True

        return redirect(
            build_frontend_url(
                "/auth/oauth/callback",
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            )
        )

    except requests.RequestException as error:
        print("Erreur OAuth LinkedIn :", repr(error))

        return redirect_to_oauth_error(
            "Impossible de valider la connexion LinkedIn."
        )

    except Exception as error:
        print("Erreur callback LinkedIn :", repr(error))

        return redirect_to_oauth_error(
            "Une erreur est survenue pendant la connexion LinkedIn."
        )


@ensure_csrf_cookie
@require_GET
def api_csrf(request):
    return JsonResponse({
        "success": True,
        "message": "Cookie CSRF initialisé.",
    })
