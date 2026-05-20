from django.apps import AppConfig
import os


class DataModuleConfig(AppConfig):
    name = 'data_module'

    def ready(self):
        # != "true" → démarre une seule fois, évite le double lancement
        if os.environ.get("RUN_MAIN") != "true":
            from .scheduler import start
            start()