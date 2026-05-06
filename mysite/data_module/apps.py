from django.apps import AppConfig
import os


class DataModuleConfig(AppConfig):
    name = 'data_module'

    def ready(self):
        # éviter double lancement du scheduler
        if os.environ.get("RUN_MAIN") == "true":
            from .scheduler import start
            start()