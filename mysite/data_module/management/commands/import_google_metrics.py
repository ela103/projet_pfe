from django.core.management.base import BaseCommand

from data_module.models import Website, GAMetrics, GSCMetrics, GAEvent, Notification
from data_module.google_analytics import get_ga4_daily, get_ga4_events
from data_module.search_console import get_gsc_daily
from data_module.alerts import send_pipeline_error_email


class Command(BaseCommand):
    help = "Importe les données GA4, GA Events et GSC"

    def handle(self, *args, **kwargs):
        websites = Website.objects.all()

        for website in websites:
            if not website.ga4_property_id and not website.gsc_site_url:
                continue

            try:
                # ==========================
                # 1. Import GA4 Metrics
                # ==========================
                if website.ga4_property_id:
                    ga_rows = get_ga4_daily(website.ga4_property_id, days=7)

                    for r in ga_rows:
                        GAMetrics.objects.update_or_create(
                            website=website,
                            date=r["date"],
                            page_path=r["page_path"],
                            defaults={
                                "active_users": r["active_users"],
                                "sessions": r["sessions"],
                                "page_views": r["page_views"],
                                "engaged_sessions": r.get("engaged_sessions", 0),
                                "engagement_rate": r.get("engagement_rate", 0),
                                "average_session_duration": r.get("average_session_duration", 0),
                                "screen_page_views_per_user": r.get("screen_page_views_per_user", 0),
                            },
                        )

                    print(f"GA4 metrics importées pour {website.name} ✔️")

                    # ==========================
                    # 2. Import GA4 Events
                    # ==========================
                    event_rows = get_ga4_events(website.ga4_property_id, days=7)

                    for event in event_rows:
                        GAEvent.objects.update_or_create(
                            website=website,
                            date=event["date"],
                            page_path=event["page_path"],
                            event_name=event["event_name"],
                            defaults={
                                "event_count": event["event_count"],
                                "users": event["users"],
                                "event_count_per_user": event["event_count_per_user"],
                                "total_revenue": event["total_revenue"],
                            },
                        )

                    print(f"GA events importés pour {website.name} ✔️")

                # ==========================
                # 3. Import GSC Metrics
                # ==========================
                if website.gsc_site_url:
                    gsc_rows = get_gsc_daily(website.gsc_site_url, days=7)

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

                    print(f"GSC metrics importées pour {website.name} ✔️")

                print(f"{website.name} importé complètement ✔️")

            except Exception as e:
                error_message = f"Erreur pour {website.name} : {e}"
                print(error_message)

                Notification.objects.create(
                    title="Problème partiel ETL GA4/GSC",
                    message=error_message,
                    level="warning",
                    source="import_google_metrics",
                )

                try:
                    send_pipeline_error_email(
                        error_message,
                        subject="Alerte ETL - Problème partiel sur un site GA4/GSC",
                        intro=(
                            "Le pipeline ETL a continué son exécution, mais "
                            "un site n'a pas pu être importé correctement."
                        ),
                    )
                except Exception as mail_error:
                    print(f"Email d'alerte non envoyé : {mail_error}")
