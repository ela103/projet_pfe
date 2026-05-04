import os
import sys
import django
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mysite.settings")
django.setup()

from data_module.models import GAMetrics, GAEvent

# -----------------------------
# 1) GA METRICS
# -----------------------------
ga_data = GAMetrics.objects.all().values(
    "website_id",
    "page_path",
    "active_users",
    "sessions",
    "page_views",
    "engaged_sessions",
    "engagement_rate",
    "average_session_duration",
    "screen_page_views_per_user",
)

df_ga = pd.DataFrame(list(ga_data))
df_ga = df_ga.fillna(0)

# garder seulement les pages non vides
df_ga = df_ga[df_ga["page_path"] != ""]

# agrégation par page
df_ga_grouped = df_ga.groupby(["website_id", "page_path"]).agg({
    "active_users": "sum",
    "sessions": "sum",
    "page_views": "sum",
    "engaged_sessions": "sum",
    "engagement_rate": "mean",
    "average_session_duration": "mean",
    "screen_page_views_per_user": "mean",
}).reset_index()

# -----------------------------
# 2) GA EVENTS
# -----------------------------
events_data = GAEvent.objects.all().values(
    "website_id",
    "page_path",
    "event_name",
    "event_count",
)

df_events = pd.DataFrame(list(events_data))
df_events = df_events.fillna(0)

# garder seulement les pages non vides
df_events = df_events[df_events["page_path"] != ""]

# pivot event_name -> colonnes
df_events_pivot = df_events.pivot_table(
    index=["website_id", "page_path"],
    columns="event_name",
    values="event_count",
    aggfunc="sum",
    fill_value=0
).reset_index()

df_events_pivot.columns.name = None

# -----------------------------
# 3) MERGE
# -----------------------------
df_final = pd.merge(
    df_ga_grouped,
    df_events_pivot,
    on=["website_id", "page_path"],
    how="left"
)

df_final = df_final.fillna(0)
# -----------------------------
# 5) LABEL (performance)
# -----------------------------
df_final["performance_label"] = (
    (df_final["engagement_rate"] >= 0.5) &
    (df_final["sessions"] >= 10) &
    (df_final["page_views"] >= 20)
).astype(int)

print("\nDistribution du label :")
print(df_final["performance_label"].value_counts())
# -----------------------------
# 4) SAVE
# -----------------------------
output_path = os.path.join(BASE_DIR, "dataset_ga_events_step1.csv")
df_final.to_csv(output_path, index=False)

print("✅ dataset_ga_events_step1.csv créé")
print("Chemin :", output_path)
print("Nombre de lignes :", len(df_final))
print("Colonnes :", list(df_final.columns))
print(df_final.head())