from apscheduler.schedulers.background import BackgroundScheduler
from django.core.management import call_command


def start():
    scheduler = BackgroundScheduler()

    scheduler.add_job(
        lambda: call_command("import_google_metrics"),
        trigger="cron",
        hour=4,
        minute=0,
        id="daily_import",
        replace_existing=True,
    )

    scheduler.start()

    print("Scheduler démarré ✅")