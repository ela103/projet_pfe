from django.apps import AppConfig


class CompetitorModuleConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "competitor_module"

    def ready(self):
        from .scheduler import start

        start()