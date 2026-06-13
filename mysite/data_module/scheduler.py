from apscheduler.schedulers.background import BackgroundScheduler
from django.core.management import call_command
from django.utils import timezone

from data_module.alerts import send_pipeline_error_email
from data_module.models import Notification
from ai_module.weekly_summary import run_weekly_seo_summaries


def run_job():
    try:
        print("Début du pipeline automatique GA4/GSC...")

        print("1/2 - Import vers les tables opérationnelles...")
        call_command("import_google_metrics")

        print("2/2 - Synchronisation vers le data warehouse...")
        call_command("sync_datawarehouse")

        Notification.objects.create(
            title="Pipeline ETL terminé",
            message=(
                "Les données Google ont été importées dans les tables "
                "opérationnelles puis synchronisées vers le data warehouse."
            ),
            level="success",
            source="scheduler",
        )

        print(
            "Pipeline terminé avec succès : "
            "import Google + synchronisation du data warehouse ✅"
        )

    except Exception as e:
        error_message = str(e)

        Notification.objects.create(
            title="Erreur pipeline ETL GA4/GSC",
            message=error_message,
            level="error",
            source="scheduler",
        )

        try:
            send_pipeline_error_email(error_message)
            print("Email d'alerte envoyé ✅")

        except Exception as mail_err:
            Notification.objects.create(
                title="Erreur envoi email d'alerte",
                message=str(mail_err),
                level="warning",
                source="email_alert",
            )

            print(f"Email non envoyé : {mail_err}")

        print(f"Erreur du pipeline : {error_message}")


        
def run_weekly_summary_job():
    try:
        print("Début de génération des résumés hebdomadaires...")

        run_weekly_seo_summaries()

        print("Résumés hebdomadaires générés avec succès ✅")

    except Exception as e:
        error_message = str(e)

        Notification.objects.create(
            title="Erreur résumé hebdomadaire SEO",
            message=error_message,
            level="error",
            source="weekly_summary_scheduler",
        )

        print(
            "Erreur pendant la génération "
            f"du résumé hebdomadaire : {error_message}"
        )


def start():
    scheduler = BackgroundScheduler(
        timezone=str(timezone.get_current_timezone())
    )

    # Import quotidien GA4/GSC à 04:00
    scheduler.add_job(
        run_job,
        trigger="cron",
        hour=4,
        minute=0,
        id="daily_import",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

    # Résumé SEO chaque lundi à 08:00
    scheduler.add_job(
        run_weekly_summary_job,
        trigger="cron",
        day_of_week="mon",
        hour=8,
        minute=0,
        id="weekly_seo_summary",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

    scheduler.start()

    print(
        "Scheduler démarré :\n"
        "- Import quotidien à 04:00\n"
        "- Résumé SEO chaque lundi à 08:00 ✅"
    )