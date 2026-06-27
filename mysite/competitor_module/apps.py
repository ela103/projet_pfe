from django.apps import AppConfig
import os
import sys


def should_start_scheduler():
    skip_commands = {
        "check",
        "collectstatic",
        "makemigrations",
        "migrate",
        "shell",
        "showmigrations",
        "test",
    }

    if len(sys.argv) > 1 and sys.argv[1] in skip_commands:
        return False

    if len(sys.argv) > 1 and sys.argv[1] == "runserver":
        return os.environ.get("RUN_MAIN") == "true"

    return True


class CompetitorModuleConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "competitor_module"

    def ready(self):
        if not should_start_scheduler():
            return

        from .scheduler import start

        start()
