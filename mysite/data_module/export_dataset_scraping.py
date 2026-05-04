import os
import sys
import django
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mysite.settings")
django.setup()

from data_module.models import ScrapedPage

data = ScrapedPage.objects.all().values(
    "website_id",
    "url",
    "title_length",
    "meta_description_length",
    "h1_count",
    "h2_count",
    "paragraph_count",
    "word_count",
    "images_count",
    "images_without_alt",
    "internal_links_count",
    "external_links_count",
    "status_code",
    "response_time_ms",
    "seo_score",
)

df = pd.DataFrame(list(data))

df = df.drop_duplicates(subset=["url"])
df = df.fillna(0)

df["technical_score_target"] = df["seo_score"]
df = df.drop(columns=["seo_score"])

output_path = os.path.join(BASE_DIR, "dataset_scraping.csv")
df.to_csv(output_path, index=False)

print("✅ dataset_scraping.csv créé avec succès")
print("Chemin :", output_path)
print("Nombre de lignes :", len(df))
print(df.head())