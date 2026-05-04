import os
import sys
import django
import pandas as pd
from urllib.parse import urlparse
# -----------------------------
# CONFIG DJANGO (IMPORTANT)
# -----------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mysite.settings")
django.setup()

def normalize_page(page):
    if not page:
        return ""
    page = str(page).strip()
    if page.startswith("http://") or page.startswith("https://"):
        parsed = urlparse(page)
        return parsed.path if parsed.path else "/"
    return page
# -----------------------------
# IMPORT MODELS
# -----------------------------
from data_module.models import GSCMetrics

# -----------------------------
# 1) Charger données
# -----------------------------
data = GSCMetrics.objects.all().values(
    "website_id",
    "page",
    "clicks",
    "impressions",
    "ctr",
    "position",
)

df = pd.DataFrame(list(data))
df["page"] = df["page"].apply(normalize_page)

# -----------------------------
# 2) Nettoyage
# -----------------------------
df = df[df["page"] != ""]

# -----------------------------
# 3) Agrégation
# -----------------------------
df_grouped = df.groupby(["website_id", "page"]).agg({
    "clicks": "sum",
    "impressions": "sum",
    "ctr": "mean",
    "position": "mean"
}).reset_index()

# -----------------------------
# 4) Label
# -----------------------------
df_grouped["visibility_label"] = (
    (df_grouped["position"] <= 10) &
    (df_grouped["impressions"] >= 10)
).astype(int)

# -----------------------------
# 5) Sauvegarde
# -----------------------------
df_grouped["ctr"] = df_grouped["ctr"].round(3)
df_grouped["position"] = df_grouped["position"].round(2)
df_grouped.to_csv("dataset_gsc_step1.csv", index=False)

print(" dataset_gsc_step1.csv créé")
print("Lignes :", len(df_grouped))
print(df_grouped.head())