# test_google_all_websites.py

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mysite.settings")
django.setup()

from data_module.models import Website
from data_module.google_analytics import get_ga4_kpis, get_ga4_daily
from data_module.search_console import get_gsc_kpis, get_gsc_daily


def test_all_websites():
    websites = Website.objects.all()

    if not websites.exists():
        print("Aucun site trouvé dans la table Website.")
        return

    for website in websites:
        print("\n==============================")
        print(f"Site ID : {website.id}")
        print(f"Nom : {website.name}")
        print(f"GA4 Property ID : {website.ga4_property_id}")
        print(f"GSC URL : {website.gsc_site_url}")
        print("==============================")

        if not website.ga4_property_id:
            print("GA4 ignoré ❌ : ga4_property_id manquant")
        else:
            try:
                ga_kpis = get_ga4_kpis(website.ga4_property_id)
                ga_daily = get_ga4_daily(website.ga4_property_id, days=7)

                print("GA4 OK ✅")
                print("GA4 KPIs :", ga_kpis)
                print("Nombre de lignes GA4 daily :", len(ga_daily))

                if ga_daily:
                    print("Exemple GA4 :", ga_daily[0])

            except Exception as e:
                print("Erreur GA4 ❌")
                print(e)

        if not website.gsc_site_url:
            print("GSC ignoré ❌ : gsc_site_url manquant")
        else:
            try:
                gsc_kpis = get_gsc_kpis(website.gsc_site_url, days=7)
                gsc_daily = get_gsc_daily(website.gsc_site_url, days=7)

                print("GSC OK ✅")
                print("GSC KPIs :", gsc_kpis)
                print("Nombre de lignes GSC daily :", len(gsc_daily))

                if gsc_daily:
                    print("Exemple GSC :", gsc_daily[0])

            except Exception as e:
                print("Erreur GSC ❌")
                print(e)


if __name__ == "__main__":
    test_all_websites()