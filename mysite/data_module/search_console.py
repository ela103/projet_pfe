import os
from datetime import date, timedelta

from django.conf import settings
from google.oauth2 import service_account
from googleapiclient.discovery import build
from django.http import JsonResponse

SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]


def _service():
    service_account_file = os.path.join(settings.BASE_DIR, "credentials", "ga_service.json")
    credentials = service_account.Credentials.from_service_account_file(
        service_account_file, scopes=SCOPES
    )
    return build("searchconsole", "v1", credentials=credentials)


def get_gsc_kpis(site_url: str, days: int = 7) -> dict:
    service = _service()
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    request = {
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "dimensions": ["query"],
        "rowLimit": 250,
    }

    response = service.searchanalytics().query(siteUrl=site_url, body=request).execute()
    rows = response.get("rows", [])

    total_clicks = sum(r.get("clicks", 0) for r in rows)
    total_impressions = sum(r.get("impressions", 0) for r in rows)
    ctr = (total_clicks / total_impressions) if total_impressions else 0.0

    weighted_pos_sum = sum((r.get("position", 0.0) * r.get("impressions", 0)) for r in rows)
    avg_position = (weighted_pos_sum / total_impressions) if total_impressions else 0.0

    return {
        "total_clicks": int(total_clicks),
        "total_impressions": int(total_impressions),
        "ctr": round(ctr, 4),
        "avg_position": round(avg_position, 2),
    }


def get_gsc_daily(site_url: str, days: int = 7) -> list[dict]:
    service = _service()
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

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
        
        out.append({
            "date": date.fromisoformat(r["keys"][0]),
            "page": r["keys"][1],
            "clicks": int(r.get("clicks", 0)),
            "impressions": int(r.get("impressions", 0)),
            "ctr": float(r.get("ctr", 0.0)),
            "position": float(r.get("position", 0.0)),
        })
    return out
