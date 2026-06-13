from django.core.management.base import BaseCommand
from django.db import transaction
from data_module.models import Website, GAMetrics, GSCMetrics, GAEvent
from datawarehouse.models import DimWebsite, DimDate,DimPage,FactGAMetrics,FactGSCMetrics,FactGAEvent


class Command(BaseCommand):
    help = (
        "Synchronise les données des tables opérationnelles "
        "vers le data warehouse."
    )

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.WARNING(
                "Début de la synchronisation du data warehouse..."
            )
        )

        created_count = 0
        updated_count = 0

        for website in Website.objects.all():
            _, created = DimWebsite.objects.update_or_create(
                source_website_id=website.id,
                defaults={
                    "name": website.name,
                    "ga4_property_id": website.ga4_property_id or "",
                    "gsc_site_url": website.gsc_site_url or "",
                },
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Sites créés : {created_count}"
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Sites mis à jour : {updated_count}"
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                "Synchronisation complète du data warehouse terminée avec succès."
            )
        )
        # -------------------------------------------------
        # Synchronisation de la dimension Date
        # -------------------------------------------------

        jours_fr = [
            "",
            "Lundi",
            "Mardi",
            "Mercredi",
            "Jeudi",
            "Vendredi",
            "Samedi",
            "Dimanche",
        ]

        mois_fr = [
            "",
            "Janvier",
            "Février",
            "Mars",
            "Avril",
            "Mai",
            "Juin",
            "Juillet",
            "Août",
            "Septembre",
            "Octobre",
            "Novembre",
            "Décembre",
        ]

        ga_dates = GAMetrics.objects.values_list(
            "date",
            flat=True,
        ).distinct()

        gsc_dates = GSCMetrics.objects.values_list(
            "date",
            flat=True,
        ).distinct()

        event_dates = GAEvent.objects.values_list(
            "date",
            flat=True,
        ).distinct()

        all_dates = set(ga_dates) | set(gsc_dates) | set(event_dates)

        dates_created = 0
        dates_existing = 0

        for current_date in all_dates:
            if current_date is None:
                continue

            _, created = DimDate.objects.get_or_create(
                full_date=current_date,
                defaults={
                    "day": current_date.day,
                    "month": current_date.month,
                    "year": current_date.year,
                    "quarter": ((current_date.month - 1) // 3) + 1,
                    "day_of_week": current_date.isoweekday(),
                    "day_name": jours_fr[current_date.isoweekday()],
                    "month_name": mois_fr[current_date.month],
                },
            )

            if created:
                dates_created += 1
            else:
                dates_existing += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Dates créées : {dates_created}"
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Dates déjà existantes : {dates_existing}"
            )
        )
                # -------------------------------------------------
        # Synchronisation de la dimension Page
        # -------------------------------------------------

        pages_created = 0
        pages_existing = 0

        # Pages provenant de GA4
        for metric in GAMetrics.objects.select_related("website").all():
            page_path = (metric.page_path or "").strip()

            if not page_path:
                continue

            dim_website = DimWebsite.objects.get(
                source_website_id=metric.website_id
            )

            full_url = ""

            if metric.website.gsc_site_url:
                base_url = metric.website.gsc_site_url.rstrip("/")
                normalized_path = (
                    page_path
                    if page_path.startswith("/")
                    else f"/{page_path}"
                )
                full_url = f"{base_url}{normalized_path}"

            _, created = DimPage.objects.get_or_create(
                website=dim_website,
                page_path=page_path,
                defaults={
                    "full_url": full_url,
                },
            )

            if created:
                pages_created += 1
            else:
                pages_existing += 1

        # Pages provenant de Google Search Console
        for metric in GSCMetrics.objects.select_related("website").all():
            full_url = (metric.page or "").strip()

            if not full_url:
                continue

            dim_website = DimWebsite.objects.get(
                source_website_id=metric.website_id
            )

            page_path = full_url

            if metric.website.gsc_site_url:
                base_url = metric.website.gsc_site_url.rstrip("/")

                if full_url.startswith(base_url):
                    page_path = full_url[len(base_url):] or "/"

            _, created = DimPage.objects.get_or_create(
                website=dim_website,
                page_path=page_path,
                defaults={
                    "full_url": full_url,
                },
            )

            if created:
                pages_created += 1
            else:
                pages_existing += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Pages créées : {pages_created}"
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Pages déjà existantes : {pages_existing}"
            )
        )
        # -------------------------------------------------
        # Synchronisation de la table de faits GA4
        # -------------------------------------------------

        ga_facts_created = 0
        ga_facts_updated = 0
        ga_facts_skipped = 0

        ga_metrics = GAMetrics.objects.select_related("website").all()

        for metric in ga_metrics:
            try:
                dim_website = DimWebsite.objects.get(
                    source_website_id=metric.website_id
                )

                dim_date = DimDate.objects.get(
                    full_date=metric.date
                )

                page_path = (metric.page_path or "").strip()
                dim_page = None

                if page_path:
                    dim_page = DimPage.objects.filter(
                        website=dim_website,
                        page_path=page_path,
                    ).first()

                _, created = FactGAMetrics.objects.update_or_create(
                    website=dim_website,
                    date=dim_date,
                    page=dim_page,
                    defaults={
                        "active_users": metric.active_users,
                        "sessions": metric.sessions,
                        "page_views": metric.page_views,
                        "engaged_sessions": metric.engaged_sessions,
                        "engagement_rate": metric.engagement_rate,
                        "average_session_duration": (
                            metric.average_session_duration
                        ),
                        "screen_page_views_per_user": (
                            metric.screen_page_views_per_user
                        ),
                    },
                )

                if created:
                    ga_facts_created += 1
                else:
                    ga_facts_updated += 1

            except (DimWebsite.DoesNotExist, DimDate.DoesNotExist):
                ga_facts_skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Faits GA4 créés : {ga_facts_created}"
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Faits GA4 mis à jour : {ga_facts_updated}"
            )
        )

        if ga_facts_skipped:
            self.stdout.write(
                self.style.WARNING(
                    f"Faits GA4 ignorés : {ga_facts_skipped}"
                )
            )
        # -------------------------------------------------
        # Synchronisation de la table de faits GSC
        # -------------------------------------------------

        gsc_facts_created = 0
        gsc_facts_updated = 0
        gsc_facts_skipped = 0

        gsc_metrics = GSCMetrics.objects.select_related("website").all()

        for metric in gsc_metrics:
            try:
                dim_website = DimWebsite.objects.get(
                    source_website_id=metric.website_id
                )

                dim_date = DimDate.objects.get(
                    full_date=metric.date
                )

                full_url = (metric.page or "").strip()
                dim_page = None

                if full_url:
                    page_path = full_url

                    if metric.website.gsc_site_url:
                        base_url = metric.website.gsc_site_url.rstrip("/")

                        if full_url.startswith(base_url):
                            page_path = full_url[len(base_url):] or "/"

                    dim_page = DimPage.objects.filter(
                        website=dim_website,
                        page_path=page_path,
                    ).first()

                _, created = FactGSCMetrics.objects.update_or_create(
                    website=dim_website,
                    date=dim_date,
                    page=dim_page,
                    query=(metric.query or "").strip(),
                    defaults={
                        "clicks": metric.clicks,
                        "impressions": metric.impressions,
                        "ctr": metric.ctr,
                        "position": metric.position,
                    },
                )

                if created:
                    gsc_facts_created += 1
                else:
                    gsc_facts_updated += 1

            except (DimWebsite.DoesNotExist, DimDate.DoesNotExist):
                gsc_facts_skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Faits GSC créés : {gsc_facts_created}"
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Faits GSC mis à jour : {gsc_facts_updated}"
            )
        )

        if gsc_facts_skipped:
            self.stdout.write(
                self.style.WARNING(
                    f"Faits GSC ignorés : {gsc_facts_skipped}"
                )
            )
            # -------------------------------------------------
        # Synchronisation de la table de faits des événements GA4
        # -------------------------------------------------

        ga_event_facts_created = 0
        ga_event_facts_updated = 0
        ga_event_facts_skipped = 0

        ga_events = GAEvent.objects.select_related("website").all()

        for event in ga_events:
            try:
                dim_website = DimWebsite.objects.get(
                    source_website_id=event.website_id
                )

                dim_date = DimDate.objects.get(
                    full_date=event.date
                )

                page_path = (event.page_path or "").strip()
                dim_page = None

                if page_path:
                    dim_page = DimPage.objects.filter(
                        website=dim_website,
                        page_path=page_path,
                    ).first()

                _, created = FactGAEvent.objects.update_or_create(
                    website=dim_website,
                    date=dim_date,
                    page=dim_page,
                    event_name=event.event_name,
                    defaults={
                        "event_count": event.event_count,
                        "users": event.users,
                        "event_count_per_user": (
                            event.event_count_per_user
                        ),
                        "total_revenue": event.total_revenue,
                    },
                )

                if created:
                    ga_event_facts_created += 1
                else:
                    ga_event_facts_updated += 1

            except (DimWebsite.DoesNotExist, DimDate.DoesNotExist):
                ga_event_facts_skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Faits événements GA4 créés : {ga_event_facts_created}"
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Faits événements GA4 mis à jour : {ga_event_facts_updated}"
            )
        )

        if ga_event_facts_skipped:
            self.stdout.write(
                self.style.WARNING(
                    f"Faits événements GA4 ignorés : {ga_event_facts_skipped}"
                )
            )