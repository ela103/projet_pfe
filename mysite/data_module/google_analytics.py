import os
from datetime import date

from django.conf import settings
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, RunRealtimeReportRequest
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
    Données GA4 par date et page.
    Retourne une liste vide si GA4 ne renvoie aucune donnée.
    """
    client = _client()

    request = RunReportRequest(
        property=f"properties/{property_id}",
        dimensions=[
            {"name": "date"},
            {"name": "pagePath"},
        ],
        metrics=[
            {"name": "activeUsers"},
            {"name": "sessions"},
            {"name": "screenPageViews"},
            {"name": "eventCount"},
            {"name": "engagedSessions"},
            {"name": "engagementRate"},
            {"name": "averageSessionDuration"},
            {"name": "screenPageViewsPerUser"},
        ],
        date_ranges=[
            {
                "start_date": f"{days}daysAgo",
                "end_date": "today",
            }
        ],
    )

    response = client.run_report(request)

    print("Nombre de lignes GA4 daily reçues :", len(response.rows))

    dates = set()
    for row in response.rows:
        date_value = row.dimension_values[0].value
        dates.add(date_value)

    print("Dates reçues depuis GA4 daily :", sorted(dates))

    rows = []

    for row in response.rows:
        date_value = row.dimension_values[0].value

        raw_page_path = (
            row.dimension_values[1].value
            if len(row.dimension_values) > 1
            else None
        )

        page_path = normalize_ga_page_path(raw_page_path)
        day = date(
            int(date_value[0:4]),
            int(date_value[4:6]),
            int(date_value[6:8])
        )
        rows.append({
            "date": day,
            "page_path": page_path,
            "active_users": int(row.metric_values[0].value or 0),
            "sessions": int(row.metric_values[1].value or 0),
            "page_views": int(row.metric_values[2].value or 0),
            "event_count": int(float(row.metric_values[3].value or 0)),
            "engaged_sessions": int(float(row.metric_values[4].value or 0)),
            "engagement_rate": round(float(row.metric_values[5].value or 0), 2),
            "average_session_duration": round(float(row.metric_values[6].value or 0), 2),
            "screen_page_views_per_user": round(float(row.metric_values[7].value or 0), 2),
        })

    return rows
def get_ga4_realtime(property_id: str) -> dict:
    client = _client()

    request = RunRealtimeReportRequest(
        property=f"properties/{property_id}",
        metrics=[
            {"name": "activeUsers"},
        ],
    )

    response = client.run_realtime_report(request)

    if not response.rows:
        return {"activeUsers": 0}

    return {
        "activeUsers": int(response.rows[0].metric_values[0].value)
    }
def normalize_ga_page_path(page_path: str | None) -> str | None:
    if not page_path:
        return None

    page_path = page_path.strip()
    if not page_path:
        return None

    if page_path != "/" and page_path.endswith("/"):
        page_path = page_path.rstrip("/")

    return page_path
def get_ga4_events(property_id: str, days: int = 7) -> list[dict]:
    """
    Données GA4 des événements par date et type d'événement.
    Retour:
    [
        {
            "date": YYYY-MM-DD,
            "event_name": "...",
            "event_count": ...,
            "users": ...,
            "event_count_per_user": ...,
            "total_revenue": ...
        },
        ...
    ]
    """
    client = _client()

    request = RunReportRequest(
        property=f"properties/{property_id}",
        dimensions=[
            {"name": "date"},
            {"name": "eventName"},
            {"name": "pagePath"},
        ],
        metrics=[
            {"name": "eventCount"},
            {"name": "totalUsers"},
            {"name": "eventCountPerUser"},
            {"name": "totalRevenue"},
        ],
        date_ranges=[{"start_date": f"{days}daysAgo", "end_date": "today"}],
    )

    response = client.run_report(request)

    rows = []
    for row in response.rows:
        d = row.dimension_values[0].value  # YYYYMMDD
        event_name = row.dimension_values[1].value
        page_path = row.dimension_values[2].value
        print("EVENT:", event_name, "PAGE:", page_path)

        day = date(int(d[0:4]), int(d[4:6]), int(d[6:8]))

        rows.append({
            "date": day,
            "event_name": event_name,
            "page_path": page_path,
            "event_count": int(float(row.metric_values[0].value or 0)),
            "users": int(float(row.metric_values[1].value or 0)),
            "event_count_per_user": round(float(row.metric_values[2].value or 0), 2),
            "total_revenue": float(row.metric_values[3].value or 0),
        })

    return rows