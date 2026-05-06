from django.core.management.base import BaseCommand
from data_module.models import Website, GAMetrics, GSCMetrics
from data_module.google_analytics import get_ga4_daily
from data_module.search_console import get_gsc_daily
from data_module.alerts import send_pipeline_error_email


class Command(BaseCommand):
    help = "Importe les données GA4 et GSC"

    def handle(self, *args, **kwargs):
        websites = Website.objects.all()

        for website in websites:
            if not website.ga4_property_id or not website.gsc_site_url:
                continue

            try:
                ga_rows = get_ga4_daily(website.ga4_property_id, days=1)
                gsc_rows = get_gsc_daily(website.gsc_site_url, days=1)

                for r in ga_rows:
                    GAMetrics.objects.update_or_create(
                        website=website,
                        date=r["date"],
                        page_path=r["page_path"],
                        defaults={
                            "active_users": r["active_users"],
                            "sessions": r["sessions"],
                            "page_views": r["page_views"],
                        },
                    )

                for r in gsc_rows:
                    GSCMetrics.objects.update_or_create(
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

                print(f"{website.name} importé ✔️")

            except Exception as e:
                error_message = f"Erreur pour {website.name} : {e}"
                print(error_message)

                # Monitoring
                send_pipeline_error_email(error_message)