from apscheduler.schedulers.background import BackgroundScheduler
from django.core.management import call_command
from django.utils import timezone

from data_module.alerts import send_pipeline_error_email
from data_module.models import Notification


def run_job():
    try:
        print("Début du pipeline automatique GA4/GSC...")

        # Exécution de la commande d'import
        call_command("import_google_metrics")

        # Si tout marche, on ne crée pas de notification dans la cloche
        print("Pipeline terminé avec succès ✅")

    except Exception as e:
        error_message = str(e)

        # Si erreur, on crée une notification visible dans l'interface
        Notification.objects.create(
            title="Erreur pipeline ETL GA4/GSC",
            message=error_message,
            level="error",
            source="scheduler",
        )

        # Puis on envoie aussi un email d'alerte
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


def start():
    scheduler = BackgroundScheduler(timezone=str(timezone.get_current_timezone()))

    scheduler.add_job(
        run_job,
        trigger="cron",
        hour=4,
        minute=0,
        id="daily_import",
        replace_existing=True,
    )

    scheduler.start()
    print("Scheduler démarré : import quotidien à 04:00 ✅")