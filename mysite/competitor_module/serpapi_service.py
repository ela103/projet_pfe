import os
import requests
from urllib.parse import urlparse
from dotenv import load_dotenv

from .models import Keyword, Competitor, SerpResult

load_dotenv()

SERPAPI_KEY = os.getenv("SERPAPI_KEY")


def extract_domain(url):
    parsed_url = urlparse(url)
    domain = parsed_url.netloc.replace("www.", "")
    return domain


def collect_serp_results(keyword_text, location="Tunisia", num_results=10):
    if not SERPAPI_KEY:
        raise ValueError("SERPAPI_KEY est manquante dans le fichier .env")

    params = {
        "engine": "google",
        "q": keyword_text,
        "api_key": SERPAPI_KEY,
        "location": location,
        "num": num_results,
        "hl": "fr",
        "gl": "tn",
    }

    response = requests.get(
        "https://serpapi.com/search.json",
        params=params,
        timeout=30
    )

    response.raise_for_status()
    data = response.json()

    keyword, _ = Keyword.objects.get_or_create(
        keyword=keyword_text
    )

    organic_results = data.get("organic_results", [])

    saved_results = []

    for item in organic_results:
        url = item.get("link")
        position = item.get("position")

        if not url or not position:
            continue

        domain = extract_domain(url)

        competitor, _ = Competitor.objects.get_or_create(
            domain=domain,
            defaults={
                "name": domain,
                "country": location,
            }
        )

        serp_result, _ = SerpResult.objects.update_or_create(
            keyword=keyword,
            url=url,
            position=position,
            defaults={
                "competitor": competitor,
                "title": item.get("title"),
                "snippet": item.get("snippet"),
                "source": "serpapi",
            }
        )

        saved_results.append(serp_result)

    return saved_results