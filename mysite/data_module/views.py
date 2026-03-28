import os
from django.http import JsonResponse
from django.shortcuts import redirect

from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from .google_analytics import get_ga4_kpis
from .search_console import get_gsc_kpis, get_gsc_daily
from django.views.decorators.http import require_http_methods

from .google_analytics import get_ga4_daily
from .search_console import get_gsc_daily
from .models import Website, GAMetrics, GSCMetrics

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

CLIENT_SECRETS_FILE = os.path.join(
    os.path.dirname(__file__),
    "..",
    "credentials",
    "client_secret.json"
)

# -------------------------------
# GSC DAILY (liste par jour)
# -------------------------------
def gsc_daily(request):
    site_url = "https://wondrous-starlight-2cf138.netlify.app/"
    days = 7
    data = get_gsc_daily(site_url, days=days)
    return JsonResponse({"response": data})


# -------------------------------
# TEST GA4
# -------------------------------
def ga4_test(request):
    property_id = "524853110"
    data = get_ga4_kpis(property_id)
    return JsonResponse({"response": data})


# -------------------------------
# TEST GSC
# -------------------------------
def gsc_test(request):
    site_url = "https://wondrous-starlight-2cf138.netlify.app/"
    data = get_gsc_kpis(site_url)
    return JsonResponse({"response": data})


# -------------------------------
# OAUTH CALLBACK (IMPORTANT: /data/)
# -------------------------------
def oauth2_callback(request):
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=[
            "https://www.googleapis.com/auth/analytics.readonly",
            "https://www.googleapis.com/auth/webmasters.readonly",
        ],
        redirect_uri="http://127.0.0.1:8000/data/oauth2/callback/",
    )

    authorization_response = request.get_full_path()
    flow.fetch_token(authorization_response="http://127.0.0.1:8000" + authorization_response)

    credentials = flow.credentials

    request.session["credentials"] = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": credentials.scopes,
    }

    return redirect("/data/ga4-dashboard/")


# -------------------------------
# GOOGLE LOGIN (IMPORTANT: /data/)
# -------------------------------
def google_login(request):
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=[
            "https://www.googleapis.com/auth/analytics.readonly",
            "https://www.googleapis.com/auth/webmasters.readonly",
        ],
        redirect_uri="http://127.0.0.1:8000/data/oauth2/callback/",
    )

    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )

    request.session["state"] = state
    return redirect(authorization_url)


# -------------------------------
# GA4 DASHBOARD (via OAuth creds)
# -------------------------------
def ga4_dashboard(request):
    if "credentials" not in request.session:
        return redirect("/data/login/google/")

    creds = Credentials(**request.session["credentials"])
    service = build("analyticsdata", "v1beta", credentials=creds)

    property_id = "524853110"

    request_body = {
        "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
        "metrics": [
            {"name": "activeUsers"},
            {"name": "sessions"},
            {"name": "screenPageViews"},
        ],
    }

    response = service.properties().runReport(
        property=f"properties/{property_id}",
        body=request_body,
    ).execute()

    return JsonResponse(response)


# -------------------------------
# GSC DASHBOARD (simple)
# -------------------------------
def gsc_dashboard(request):
    site_url = "https://wondrous-starlight-2cf138.netlify.app/"
    data = get_gsc_kpis(site_url)
    return JsonResponse({
        "clicks": data["total_clicks"],
        "impressions": data["total_impressions"],
        "ctr": data["ctr"],
        "avg_position": data["avg_position"],
    })


def test_gsc(request):
    site_url = "https://wondrous-starlight-2cf138.netlify.app/"
    data = get_gsc_kpis(site_url)
    return JsonResponse(data)

@require_http_methods(["POST", "GET"])
def import_metrics(request):
    """
    Récupère les données GA4 + GSC (par jour) et les stocke dans PostgreSQL.
    - GET : pratique pour tester dans le navigateur
    - POST : plus logique pour un import
    """
    # 1) Paramètres (pour l’instant en dur, tu peux les mettre dans Website ensuite)
    website_name = "site_test"
    property_id = "524853110"
    site_url = "https://wondrous-starlight-2cf138.netlify.app/"
    days = 7

    # 2) Website (1 seul site pour l’instant)
    website, _ = Website.objects.get_or_create(
        name=website_name,
        defaults={"ga4_property_id": property_id, "gsc_site_url": site_url},
    )

    # 3) EXTRACT (API)
    ga_rows = get_ga4_daily(property_id, days=days)   # [{"date": ..., "active_users": ...}]
    gsc_rows = get_gsc_daily(site_url, days=days)     # [{"date": ..., "clicks": ...}]

    # 4) LOAD (UPSERT)
    ga_saved = 0
    for r in ga_rows:
        obj, created = GAMetrics.objects.update_or_create(
            website=website,
            date=r["date"],
            page_path=r["page_path"],
            defaults={
                "active_users": r["active_users"],
                "sessions": r["sessions"],
                "page_views": r["page_views"],
            },
        )
        ga_saved += 1

    gsc_saved = 0
    for r in gsc_rows:
        obj, created = GSCMetrics.objects.update_or_create(
            website=website,
            date=r["date"],
            page=r["page"],
            defaults={
                "clicks": r["clicks"],
                "impressions": r["impressions"],
                "ctr": r["ctr"],
                "position": r["position"],
            },
        )
        gsc_saved += 1

    return JsonResponse({
        "status": "success",
        "website_id": website.id,
        "ga_rows_saved": ga_saved,
        "gsc_rows_saved": gsc_saved
    })