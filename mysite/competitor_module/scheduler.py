from apscheduler.schedulers.background import BackgroundScheduler

from .models import Keyword
from .serpapi_service import collect_serp_results
from .scraping_service import scrape_all_serp_results


def weekly_competitor_collection():
    print("Début collecte concurrentielle hebdomadaire...")

    keywords = Keyword.objects.all()

    if not keywords.exists():
        print("Aucun mot-clé trouvé dans la base.")
        return

    for keyword in keywords:
        print(f"Collecte SerpApi pour : {keyword.keyword}")
        collect_serp_results(keyword.keyword, num_results=10)

    scrape_all_serp_results()

    print("Collecte concurrentielle terminée.")


def start():
    scheduler = BackgroundScheduler()

    scheduler.add_job(
        weekly_competitor_collection,
        "cron",
        day_of_week="mon",
        hour=4,
        minute=0,
        id="weekly_competitor_collection",
        replace_existing=True,
    )

    scheduler.start()
    print("Scheduler concurrentiel démarré.")