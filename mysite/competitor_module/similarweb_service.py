import os
import requests
from dotenv import load_dotenv

from .models import Competitor, TrafficEstimate

load_dotenv()

SIMILARWEB_API_KEY = os.getenv("SIMILARWEB_API_KEY")


def collect_similarweb_traffic(domain):
    if not SIMILARWEB_API_KEY:
        raise ValueError("SIMILARWEB_API_KEY est manquante dans le fichier .env")

    print(f"Collecte Similarweb pour : {domain}")

    # L'URL exacte dépend du type d'accès Similarweb/API activé sur ton compte.
    # On va l'ajuster selon ton dashboard Similarweb.
    return None