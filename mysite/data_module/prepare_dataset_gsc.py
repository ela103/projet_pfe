import pandas as pd
import numpy as np

np.random.seed(42)

# -----------------------------
# 1) Charger le dataset GSC existant
# -----------------------------
df = pd.read_csv("dataset_gsc_step1.csv")

print("Dataset initial :", len(df), "lignes")

# -----------------------------
# 2) Pages supplémentaires connues dans ton projet
#    (issues de GA / scraping)
# -----------------------------
extra_pages = [
    {"website_id": 1, "page": "/page2"},
    {"website_id": 1, "page": "/page3"},
    {"website_id": 1, "page": "/page4"},
    {"website_id": 1, "page": "/page5"},
    {"website_id": 5, "page": "/cabinet/appointments.html"},
    {"website_id": 5, "page": "/voyages"},
    {"website_id": 6, "page": "/travel_agency"},
]

# -----------------------------
# 3) Ajouter les pages manquantes si elles n'existent pas déjà
# -----------------------------
existing_keys = set(zip(df["website_id"], df["page"]))

extra_rows = []
for item in extra_pages:
    key = (item["website_id"], item["page"])
    if key not in existing_keys:
        # on crée une ligne GSC réaliste de départ
        # mélange de pages faibles / moyennes / bonnes
        r = np.random.rand()

        if r < 0.4:
            # page faible
            clicks = np.random.randint(0, 4)
            impressions = np.random.randint(5, 40)
            ctr = np.random.uniform(0.0, 0.03)
            position = np.random.uniform(20, 60)
        elif r < 0.75:
            # page moyenne
            clicks = np.random.randint(2, 10)
            impressions = np.random.randint(20, 120)
            ctr = np.random.uniform(0.02, 0.10)
            position = np.random.uniform(8, 20)
        else:
            # bonne page
            clicks = np.random.randint(8, 25)
            impressions = np.random.randint(50, 200)
            ctr = np.random.uniform(0.05, 0.20)
            position = np.random.uniform(1, 10)

        extra_rows.append({
            "website_id": item["website_id"],
            "page": item["page"],
            "clicks": clicks,
            "impressions": impressions,
            "ctr": round(ctr, 3),
            "position": round(position, 2),
        })

df_extra = pd.DataFrame(extra_rows)

if not df_extra.empty:
    df = pd.concat([df.drop(columns=["visibility_label"], errors="ignore"), df_extra], ignore_index=True)
else:
    df = df.drop(columns=["visibility_label"], errors="ignore")

# -----------------------------
# 4) Générer des variantes réalistes
# -----------------------------
new_rows = []

N_VARIANTS = 45   # ~ 15 pages * 45 = volume suffisant

for _, row in df.iterrows():
    for _ in range(N_VARIANTS):
        new_row = row.copy()

        # variations réalistes
        new_row["clicks"] = max(0, round(row["clicks"] * np.random.uniform(0.6, 1.5)))
        new_row["impressions"] = max(1, round(row["impressions"] * np.random.uniform(0.7, 1.6)))

        new_row["ctr"] = min(
            1.0,
            max(0.0, row["ctr"] * np.random.uniform(0.7, 1.3))
        )

        new_row["position"] = max(
            1.0,
            row["position"] * np.random.uniform(0.7, 1.4)
        )

        # -----------------------------
        # Zone grise : pages moyennes
        # -----------------------------
        if np.random.rand() < 0.3:
            new_row["clicks"] = np.random.randint(1, 8)
            new_row["impressions"] = np.random.randint(10, 80)
            new_row["ctr"] = np.random.uniform(0.02, 0.10)
            new_row["position"] = np.random.uniform(7, 20)

        # -----------------------------
        # Anomalies réalistes
        # -----------------------------
        if np.random.rand() < 0.1:
            new_row["position"] = min(100.0, new_row["position"] * np.random.uniform(1.3, 2.0))
            new_row["ctr"] = max(0.0, new_row["ctr"] * np.random.uniform(0.4, 0.8))

        # garde une cohérence simple
        if new_row["clicks"] > new_row["impressions"]:
            new_row["clicks"] = new_row["impressions"]

        # recalcul CTR si tu veux cohérence plus forte
        if new_row["impressions"] > 0:
            approx_ctr = new_row["clicks"] / new_row["impressions"]
            new_row["ctr"] = (new_row["ctr"] + approx_ctr) / 2

        # bornes finales
        new_row["ctr"] = round(min(1.0, max(0.0, new_row["ctr"])), 3)
        new_row["position"] = round(new_row["position"], 2)

        # label
        new_row["visibility_label"] = int(
            (new_row["position"] <= 10) and
            (new_row["impressions"] >= 10)
        )

        # bruit sur le label (5%)
        if np.random.rand() < 0.05:
            new_row["visibility_label"] = 1 - new_row["visibility_label"]

        new_rows.append(new_row)

# -----------------------------
# 5) Fusionner ancien + nouveau
# -----------------------------
# recalcul label pour les lignes de base
df["visibility_label"] = (
    (df["position"] <= 10) &
    (df["impressions"] >= 10)
).astype(int)

df_new = pd.DataFrame(new_rows)
df_final = pd.concat([df, df_new], ignore_index=True)

# mélanger
df_final = df_final.sample(frac=1, random_state=42).reset_index(drop=True)

# arrondis finaux
df_final["ctr"] = df_final["ctr"].round(3)
df_final["position"] = df_final["position"].round(2)

# -----------------------------
# 6) Sauvegarder
# -----------------------------
df_final.to_csv("dataset_gsc_final.csv", index=False)

print(" dataset_gsc_final.csv créé")
print("Lignes initiales :", len(df))
print("Lignes ajoutées :", len(df_new))
print("Total final :", len(df_final))

print("\nDistribution du label :")
print(df_final["visibility_label"].value_counts())

print("\nAperçu :")
print(df_final.head())