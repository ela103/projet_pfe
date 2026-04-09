import os
from django.http import JsonResponse
from django.shortcuts import redirect


from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from .google_analytics import get_ga4_kpis
from .search_console import get_gsc_kpis, get_gsc_daily
from django.views.decorators.http import require_http_methods
from django.db.models import Sum

from .google_analytics import get_ga4_daily
from .search_console import get_gsc_daily
from .models import Website, GAMetrics, GSCMetrics,GAEvent
from .google_analytics import get_ga4_realtime,get_ga4_events
from django.http import JsonResponse
from .models import GAEvent
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from data_module.models import Website, ScrapedPage
from data_module.scraper.services import scrape_and_save_page
from data_module.scraper.services import scrape_and_save_page, crawl_and_scrape_website
from django.views.decorators.http import require_GET

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
    site_url = "https://chipper-creponne-32db5f.netlify.app/"
    days = 28
    data = get_gsc_daily(site_url, days=days)
    return JsonResponse({"response": data})


# -------------------------------
# TEST GA4
# -------------------------------
def ga4_test(request):
    property_id = "530546383"
    data = get_ga4_kpis(property_id)
    return JsonResponse({"response": data})


# -------------------------------
# TEST GSC
# -------------------------------
def gsc_test(request):
    site_url = "https://chipper-creponne-32db5f.netlify.app/"
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

    property_id = "530546383"

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
    site_url = "https://chipper-creponne-32db5f.netlify.app/"
    data = get_gsc_kpis(site_url)
    return JsonResponse({
        "clicks": data["total_clicks"],
        "impressions": data["total_impressions"],
        "ctr": data["ctr"],
        "avg_position": data["avg_position"],
    })


def test_gsc(request):
    site_url = "https://chipper-creponne-32db5f.netlify.app/"
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
    property_id = "530546383"
    site_url = "https://chipper-creponne-32db5f.netlify.app/"
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
                
                "engaged_sessions": r["engaged_sessions"],
                "engagement_rate": r["engagement_rate"],
                "average_session_duration": r["average_session_duration"],
                "screen_page_views_per_user": r["screen_page_views_per_user"],
            },
        )
        ga_saved += 1

    gsc_saved = 0
    for r in gsc_rows:
        obj, created = GSCMetrics.objects.update_or_create(
            website=website,
            date=r["date"],
            page=r["page"],
            query=r["query"],
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
@require_http_methods(["POST", "GET"])
def import_ga_events(request):
    website_name = "site_test"
    property_id = "530546383"
    site_url = "https://chipper-creponne-32db5f.netlify.app/"
    days = 7

    website, _ = Website.objects.get_or_create(
        name=website_name,
        defaults={"ga4_property_id": property_id, "gsc_site_url": site_url},
    )

    event_rows = get_ga4_events(property_id, days=days)

    events_saved = 0
    for r in event_rows:
        GAEvent.objects.update_or_create(
            website=website,
            date=r["date"],
            page_path=r["page_path"],
            event_name=r["event_name"],
            defaults={
                "event_count": r["event_count"],
                "users": r["users"],
                "event_count_per_user": r["event_count_per_user"],
                "total_revenue": r["total_revenue"],
            },
        )
        events_saved += 1

    return JsonResponse({
        "status": "success",
        "website_id": website.id,
        "ga_events_saved": events_saved,
    })
from .google_analytics import get_ga4_realtime

def ga4_realtime(request):
    property_id = "530546383"

    data = get_ga4_realtime(property_id)
    return JsonResponse(data)

from django.db.models import Sum
from .models import GAMetrics, GSCMetrics

def dashboard_stats(request):
    ga_data = (
        GAMetrics.objects
        .filter(page_path__isnull=False)
        .values("date")
        .annotate(
            users=Sum("active_users"),
            sessions=Sum("sessions"),
            page_views=Sum("page_views"),
        )
        .order_by("date")
    )

    gsc_data = (
        GSCMetrics.objects
        .filter(page__isnull=False)
        .values("date")
        .annotate(
            clicks=Sum("clicks"),
            impressions=Sum("impressions"),
        )
        .order_by("date")
    )

    return JsonResponse({
        "ga_chart": list(ga_data),
        "gsc_chart": list(gsc_data),
    })
def gsc_page_distribution(request):
    data = (
        GSCMetrics.objects
        .filter(page__isnull=False)
        .values("page")
        .annotate(
            total_clicks=Sum("clicks"),
            total_impressions=Sum("impressions"),
        )
        .order_by("-total_clicks")[:5]  # 🔥 top 5
    )

    return JsonResponse({
        "pages": list(data)
    })


def ga_events_chart(request):
    try:
        events = list(
            GAEvent.objects.filter(page_path__isnull=False)
            .order_by("-date")
            .values(
                "date",
                "page_path",
                "event_name",
                "event_count",
            )[:200]
        )

        return JsonResponse({
            "events": events
        })

    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)
@csrf_exempt
@require_POST
def scrape_pages(request):
    try:
        body = json.loads(request.body)
        website_id = body.get("website_id")
        urls = body.get("urls", [])

        if not website_id:
            return JsonResponse({"error": "website_id est obligatoire."}, status=400)

        if not urls or not isinstance(urls, list):
            return JsonResponse({"error": "La liste des URLs est obligatoire."}, status=400)

        website = Website.objects.get(id=website_id)

        results = []
        for url in urls:
            page = scrape_and_save_page(website, url)
            results.append({
                "url": page.url,
                "status_code": page.status_code,
                "title": page.title,
                "seo_score": page.seo_score,
                "issues": page.issues,
                "recommendations": page.recommendations,
            })

        return JsonResponse({
            "message": "Scraping terminé avec succès.",
            "results": results
        }, status=200)

    except Website.DoesNotExist:
        return JsonResponse({"error": "Website introuvable."}, status=404)

    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON invalide."}, status=400)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
@csrf_exempt
@require_POST
def crawl_website(request):
    try:
        body = json.loads(request.body)
        website_id = body.get("website_id")
        start_url = body.get("start_url")
        max_pages = body.get("max_pages", 10)

        if not website_id:
            return JsonResponse({"error": "website_id est obligatoire."}, status=400)

        if not start_url:
            return JsonResponse({"error": "start_url est obligatoire."}, status=400)

        website = Website.objects.get(id=website_id)

        crawl_result = crawl_and_scrape_website(
            website=website,
            start_url=start_url,
            max_pages=max_pages
        )

        return JsonResponse({
            "message": "Crawling et scraping terminés avec succès.",
            "start_url": crawl_result["start_url"],
            "total_discovered": crawl_result["total_discovered"],
            "results": crawl_result["results"]
        }, status=200)

    except Website.DoesNotExist:
        return JsonResponse({"error": "Website introuvable."}, status=404)

    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON invalide."}, status=400)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
@require_GET
def get_scraped_pages(request):
    try:
        website_id = request.GET.get("website_id")

        if not website_id:
            return JsonResponse({"error": "website_id est requis"}, status=400)

        pages = ScrapedPage.objects.filter(website_id=website_id)

        data = []
        total_score = 0

        for p in pages:
            data.append({
                "url": p.url,
                "seo_score": p.seo_score,
                "title": p.title,
                "issues": p.issues,
                "recommendations": p.recommendations,
            })
            total_score += p.seo_score

        site_score = round(total_score / len(data), 2) if data else 0

        return JsonResponse({
            "site_score": site_score,
            "total_pages": len(data),
            "pages": data
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)