import os
from datetime import date

from django.conf import settings
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest
from google.oauth2 import service_account


def _client():
    credentials_path = os.path.join(settings.BASE_DIR, "credentials", "ga_service.json")
    credentials = service_account.Credentials.from_service_account_file(credentials_path)
    return BetaAnalyticsDataClient(credentials=credentials)


def get_ga4_kpis(property_id: str) -> dict:
    """
    KPI globaux sur 7 jours (utile pour cards du dashboard).
    """
    client = _client()

    request = RunReportRequest(
        property=f"properties/{property_id}",
        dimensions=[],
        metrics=[
            {"name": "activeUsers"},
            {"name": "sessions"},
            {"name": "screenPageViews"},
        ],
        date_ranges=[{"start_date": "7daysAgo", "end_date": "today"}],
    )

    response = client.run_report(request)

    if not response.rows:
        return {"activeUsers": 0, "sessions": 0, "screenPageViews": 0}

    return {
        "activeUsers": int(response.rows[0].metric_values[0].value),
        "sessions": int(response.rows[0].metric_values[1].value),
        "screenPageViews": int(response.rows[0].metric_values[2].value),
    }


def get_ga4_daily(property_id: str, days: int = 7) -> list[dict]:
    """
    Données par date (indispensable pour stockage dans PostgreSQL).
    Retour: [{"date": YYYY-MM-DD, "active_users": ..., "sessions": ..., "page_views": ...}, ...]
    """
    client = _client()

    request = RunReportRequest(
        property=f"properties/{property_id}",
        dimensions=[{"name": "date"},{"name": "pagePath"},],
        metrics=[
            {"name": "activeUsers"},
            {"name": "sessions"},
            {"name": "screenPageViews"},
        ],
        date_ranges=[{"start_date": f"{days}daysAgo", "end_date": "today"}],
    )

    response = client.run_report(request)

    rows = []
    for row in response.rows:
        d = row.dimension_values[0].value  # YYYYMMDD
        page_path = row.dimension_values[1].value if len(row.dimension_values) > 1 else None
        

        day = date(int(d[0:4]), int(d[4:6]), int(d[6:8]))
        rows.append({
            "date": day,
            "page_path": page_path,
            "active_users": int(row.metric_values[0].value),
            "sessions": int(row.metric_values[1].value),
            "page_views": int(row.metric_values[2].value),
        })
    return rows