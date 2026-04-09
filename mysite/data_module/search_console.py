import os
from datetime import date, timedelta
from urllib.parse import urlparse

from django.conf import settings
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]


def _service():
    service_account_file = os.path.join(settings.BASE_DIR, "credentials", "ga_service.json")
    credentials = service_account.Credentials.from_service_account_file(
        service_account_file, scopes=SCOPES
    )
    return build("searchconsole", "v1", credentials=credentials)


def normalize_gsc_page(page: str | None) -> str | None:
    if not page:
        return None

    page = page.strip()
    if not page:
        return None

    parsed = urlparse(page)

    # Si Google renvoie une URL complète, on garde seulement le chemin
    path = parsed.path or "/"

    # Normalisation : /page2/ -> /page2, mais on garde "/" tel quel
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")

    return path


def get_gsc_kpis(site_url: str, days: int = 7) -> dict:
    service = _service()

    # On évite les jours les plus récents car GSC a un léger délai
    end_date = date.today() - timedelta(days=1)
    start_date = end_date - timedelta(days=days - 1)

    request = {
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "dimensions": ["date"],
        "rowLimit": 250,
    }
    
    response = service.searchanalytics().query(siteUrl=site_url, body=request).execute()
    rows = response.get("rows", [])

    total_clicks = sum(int(r.get("clicks", 0)) for r in rows)
    total_impressions = sum(int(r.get("impressions", 0)) for r in rows)

    ctr = (total_clicks / total_impressions) if total_impressions > 0 else 0.0

    weighted_pos_sum = sum(
        float(r.get("position", 0.0)) * int(r.get("impressions", 0))
        for r in rows
        if int(r.get("impressions", 0)) > 0
    )
    avg_position = (weighted_pos_sum / total_impressions) if total_impressions > 0 else 0.0

    return {
        "total_clicks": total_clicks,
        "total_impressions": total_impressions,
        "ctr": round(ctr, 3),
        "avg_position": round(avg_position, 3),
    }


def get_gsc_daily(site_url: str, days: int = 7) -> list[dict]:
    service = _service()

    end_date = date.today() - timedelta(days=1)
    start_date = end_date - timedelta(days=days - 1)

    # 1) On essaie d'abord avec query
    request = {
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "dimensions": ["date", "page"],
        "rowLimit": 1000,
    }
   

    response = service.searchanalytics().query(siteUrl=site_url, body=request).execute()
    
    rows = response.get("rows", [])

    # 2) Si aucune donnée, on revient à date + page seulement
    if not rows:
        request = {
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "dimensions": ["date", "page"],
            "rowLimit": 1000,
        }

        response = service.searchanalytics().query(siteUrl=site_url, body=request).execute()
        rows = response.get("rows", [])

    out = []
    for r in rows:
        keys = r.get("keys", [])

        row_date = date.fromisoformat(keys[0]) if len(keys) > 0 else None
        page = normalize_gsc_page(keys[1] if len(keys) > 1 else None)
        query = keys[2] if len(keys) > 2 else None  # sera None si fallback

        clicks = int(r.get("clicks", 0))
        impressions = int(r.get("impressions", 0))
        raw_position = float(r.get("position", 0.0))
        position = round(raw_position, 3) if impressions > 0 else 0.0
        ctr = round((clicks / impressions), 3) if impressions > 0 else 0.0

        out.append({
            "date": row_date,
            "page": page,
            "query": query,
            "clicks": clicks,
            "impressions": impressions,
            "ctr": ctr,
            "position": position,
        })

    return out