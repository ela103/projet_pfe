import os
from django.http import JsonResponse
from django.shortcuts import redirect


from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from .google_analytics import get_ga4_kpis
from .search_console import get_gsc_kpis, get_gsc_daily
from django.views.decorators.http import require_http_methods
from django.db.models import Sum,Avg

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
from django.http import JsonResponse
from .models import Website

from .models import Notification

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
    website_id = request.GET.get("website_id")
    days = int(request.GET.get("days", 7))

    if website_id:
        try:
            websites = [Website.objects.get(id=website_id)]
        except Website.DoesNotExist:
            return JsonResponse({"error": "Website introuvable"}, status=404)
    else:
        websites = Website.objects.all()

    results = []

    for website in websites:
        property_id = website.ga4_property_id
        site_url = website.gsc_site_url

        if not property_id or not site_url:
            results.append({
                "website_id": website.id,
                "website_name": website.name,
                "status": "skipped",
                "reason": "ga4_property_id ou gsc_site_url manquant",
            })
            continue

        try:
            ga_rows = get_ga4_daily(property_id, days=days)
            gsc_rows = get_gsc_daily(site_url, days=days)

            ga_saved = 0

            for r in ga_rows:
                GAMetrics.objects.update_or_create(
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
                query_value = r.get("query") or ""

                existing_rows = GSCMetrics.objects.filter(
                    website=website,
                    date=r["date"],
                    page=r["page"],
                    query=query_value,
                )

                if existing_rows.exists():
                    existing_rows.update(
                        clicks=r["clicks"],
                        impressions=r["impressions"],
                        ctr=r["ctr"],
                        position=r["position"],
                    )
                else:
                    GSCMetrics.objects.create(
                        website=website,
                        date=r["date"],
                        page=r["page"],
                        query=query_value,
                        clicks=r["clicks"],
                        impressions=r["impressions"],
                        ctr=r["ctr"],
                        position=r["position"],
                    )

                gsc_saved += 1

            results.append({
                "website_id": website.id,
                "website_name": website.name,
                "status": "success",
                "ga_rows_saved": ga_saved,
                "gsc_rows_saved": gsc_saved,
            })

        except Exception as e:
            results.append({
                "website_id": website.id,
                "website_name": website.name,
                "status": "error",
                "error": str(e),
            })

    return JsonResponse({
        "status": "completed",
        "results": results,
    })
@require_http_methods(["POST", "GET"])
def import_ga_events(request):
    website_id = request.GET.get("website_id")
    days = 7

    if website_id:
        try:
            websites = [Website.objects.get(id=website_id)]
        except Website.DoesNotExist:
            return JsonResponse({"error": "Website introuvable"}, status=404)
    else:
        websites = Website.objects.all()

    results = []

    for website in websites:
        property_id = website.ga4_property_id

        if not property_id:
            results.append({
                "website_id": website.id,
                "website_name": website.name,
                "status": "skipped",
                "reason": "ga4_property_id manquant"
            })
            continue

        try:
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

            results.append({
                "website_id": website.id,
                "website_name": website.name,
                "status": "success",
                "ga_events_saved": events_saved,
            })

        except Exception as e:
            results.append({
                "website_id": website.id,
                "website_name": website.name,
                "status": "error",
                "error": str(e)
            })

    return JsonResponse({
        "status": "completed",
        "results": results
    })
from .google_analytics import get_ga4_realtime

def ga4_realtime(request):
    property_id = "530546383"

    data = get_ga4_realtime(property_id)
    return JsonResponse(data)

from django.db.models import Sum
from .models import GAMetrics, GSCMetrics

def dashboard_stats(request):
    website_id = request.GET.get("website_id")
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    if not website_id:
        return JsonResponse({"error": "website_id requis"}, status=400)

    ga_query = GAMetrics.objects.filter(
        website_id=website_id,
        page_path__isnull=False
    )

    gsc_query = GSCMetrics.objects.filter(
        website_id=website_id,
        page__isnull=False
    )

    if start_date and end_date:
        ga_query = ga_query.filter(date__range=[start_date, end_date])
        gsc_query = gsc_query.filter(date__range=[start_date, end_date])

    ga_data = (
        ga_query
        .values("date")
        .annotate(
            users=Sum("active_users"),
            sessions=Sum("sessions"),
            page_views=Sum("page_views"),
            engagement_rate=Avg("engagement_rate"),
        )
        .order_by("date")
    )

    ga_chart = []

    for item in ga_data:
        engagement_rate = float(item.get("engagement_rate") or 0)

        # Chez toi, engagement_rate semble être stocké entre 0 et 1.
        # Exemple : 0.65 = 65 %
        if engagement_rate <= 1:
            engagement_rate_percent = round(engagement_rate * 100, 2)
            bounce_rate = round((1 - engagement_rate) * 100, 2)
        else:
            engagement_rate_percent = round(engagement_rate, 2)
            bounce_rate = round(100 - engagement_rate, 2)

        ga_chart.append({
            "date": item["date"],
            "users": item["users"] or 0,
            "sessions": item["sessions"] or 0,
            "page_views": item["page_views"] or 0,
            "engagement_rate": engagement_rate_percent,
            "bounce_rate": bounce_rate,
        })

    gsc_data = (
        gsc_query
        .values("date")
        .annotate(
            clicks=Sum("clicks"),
            impressions=Sum("impressions"),
            ctr=Avg("ctr"),
            position=Avg("position"),
        )
        .order_by("date")
    )

    return JsonResponse({
        "ga_chart": ga_chart,
        "gsc_chart": list(gsc_data),
    })
def gsc_page_distribution(request):
    website_id = request.GET.get("website_id")

    if not website_id:
        return JsonResponse({"error": "website_id requis"}, status=400)

    data = (
        GSCMetrics.objects
        .filter(website_id=website_id, page__isnull=False)
        .values("page")
        .annotate(
            total_clicks=Sum("clicks"),
            total_impressions=Sum("impressions"),
        )
        .order_by("-total_clicks")[:5]
    )

    return JsonResponse({
        "pages": list(data)
    })
def ga_events_chart(request):
    try:
        website_id = request.GET.get("website_id")

        if not website_id:
            return JsonResponse({"error": "website_id requis"}, status=400)

        events = list(
            GAEvent.objects
            .filter(website_id=website_id, page_path__isnull=False)
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
def websites_list(request):
    websites = Website.objects.select_related("added_by").all()

    data = []

    for website in websites:
        added_by_name = "Non renseigné"

        if website.added_by:
            added_by_name = (
                website.added_by.get_full_name()
                or website.added_by.email
                or website.added_by.username
            )

        data.append({
            "id": website.id,
            "name": website.name,
            "ga4_property_id": website.ga4_property_id,
            "gsc_site_url": website.gsc_site_url,
            "created_at": website.created_at,
            "added_by": website.added_by_id,
            "added_by_name": added_by_name,
        })

    return JsonResponse({
        "websites": data
    })

@csrf_exempt
@require_POST
def add_website(request):
    try:
        body = json.loads(request.body)

        name = body.get("name")
        ga4_property_id = body.get("ga4_property_id")
        gsc_site_url = body.get("gsc_site_url")

        if not name:
            return JsonResponse({"error": "Le nom du site est obligatoire."}, status=400)

        added_by = request.user if request.user.is_authenticated else None

        website = Website.objects.create(
            name=name,
            ga4_property_id=ga4_property_id,
            gsc_site_url=gsc_site_url,
            added_by=added_by,
        )

        added_by_name = "Non renseigné"

        if website.added_by:
            added_by_name = (
                website.added_by.get_full_name()
                or website.added_by.email
                or website.added_by.username
            )

        return JsonResponse({
            "message": "Site ajouté avec succès.",
            "website": {
                "id": website.id,
                "name": website.name,
                "ga4_property_id": website.ga4_property_id,
                "gsc_site_url": website.gsc_site_url,
                "created_at": website.created_at,
                "added_by": website.added_by_id,
                "added_by_name": added_by_name,
            }
        }, status=201)

    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON invalide."}, status=400)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def top_pages(request):
    website_id = request.GET.get("website_id")

    pages = (
        GSCMetrics.objects
        .filter(website_id=website_id)
        .values("page")
        .annotate(
            total_clicks=Sum("clicks"),
            total_impressions=Sum("impressions")
        )
        .order_by("-total_clicks")[:10]
    )

    return JsonResponse({"pages": list(pages)})
def top_keywords(request):
    website_id = request.GET.get("website_id")

    keywords = (
        GSCMetrics.objects
        .filter(website_id=website_id)
        .exclude(query__isnull=True)
        .exclude(query="")
        .values("query")
        .annotate(
            total_clicks=Sum("clicks"),
            total_impressions=Sum("impressions"),
            avg_position=Avg("position")
        )
        .order_by("-total_clicks", "-total_impressions")[:10]
    )

    return JsonResponse({"keywords": list(keywords)})
def notifications_list(request):
    notifications = Notification.objects.order_by("-created_at")[:20]

    data = []

    for notification in notifications:
        data.append({
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "level": notification.level,
            "source": notification.source,
            "is_read": notification.is_read,
            "created_at": notification.created_at,
        })

    unread_count = Notification.objects.filter(is_read=False).count()

    return JsonResponse({
        "unread_count": unread_count,
        "notifications": data,
    })

def dashboard_events(request):
    website_id = request.GET.get("website_id")
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    if not website_id:
        return JsonResponse({
            "error": "website_id est obligatoire."
        }, status=400)

    query = GAEvent.objects.filter(website_id=website_id)

    if start_date:
        query = query.filter(date__gte=start_date)

    if end_date:
        query = query.filter(date__lte=end_date)

    total_events = query.aggregate(total=Sum("event_count"))["total"] or 0
    total_users = query.aggregate(total=Sum("users"))["total"] or 0

    top_event_row = (
        query.values("event_name")
        .annotate(total=Sum("event_count"))
        .order_by("-total")
        .first()
    )

    top_event = top_event_row["event_name"] if top_event_row else ""

    return JsonResponse({
        "total_events": int(total_events),
        "total_users": int(total_users),
        "top_event": top_event,
    })
def top_visited_pages(request):
    website_id = request.GET.get("website_id")
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    if not website_id:
        return JsonResponse(
            {"error": "website_id est obligatoire"},
            status=400
        )

    queryset = GAMetrics.objects.filter(website_id=website_id)

    if start_date:
        queryset = queryset.filter(date__gte=start_date)

    if end_date:
        queryset = queryset.filter(date__lte=end_date)

    pages = (
        queryset
        .values("page_path")
        .annotate(page_views=Sum("page_views"))
        .order_by("-page_views")[:10]
    )

    data = [
        {
            "page": item["page_path"] or "Page inconnue",
            "page_views": item["page_views"] or 0,
        }
        for item in pages
    ]

    return JsonResponse({"pages": data})