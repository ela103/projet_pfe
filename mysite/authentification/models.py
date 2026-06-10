from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'email est obligatoire.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Un superuser doit avoir is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Un superuser doit avoir is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField("Prénom", max_length=25)
    last_name = models.CharField("Nom", max_length=25)
    phone_number = models.CharField("Téléphone", max_length=20, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
class PasswordResetOTP(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="password_reset_otps",
    )

    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()

    is_used = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def set_code(self, code):
        self.code_hash = make_password(code)

    def check_code(self, code):
        return check_password(code, self.code_hash)

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def is_valid(self):
        return (
            not self.is_used
            and not self.is_expired()
            and self.attempts < 5
        )

    def __str__(self):
        return f"OTP de {self.user.email}"