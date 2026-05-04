import pandas as pd
import numpy as np

# pour reproductibilité
np.random.seed(42)

# -----------------------------
# 1) Charger le dataset existant
# -----------------------------
df = pd.read_csv("dataset_ga_events_step1.csv")

print("Dataset initial :", len(df), "lignes")

# -----------------------------
# 2) Générer de nouvelles lignes cohérentes
# -----------------------------
new_rows = []

N_VARIANTS = 40   # 23 x 40 ≈ 920 nouvelles lignes

for _, row in df.iterrows():
    for _ in range(N_VARIANTS):
        new_row = row.copy()

        # variations réalistes sur les colonnes numériques
        new_row["active_users"] = max(0, round(row["active_users"] * np.random.uniform(0.7, 1.3)))
        new_row["sessions"] = max(0, round(row["sessions"] * np.random.uniform(0.7, 1.3)))
        new_row["page_views"] = max(0, round(row["page_views"] * np.random.uniform(0.7, 1.3)))
        new_row["engaged_sessions"] = max(0, round(row["engaged_sessions"] * np.random.uniform(0.7, 1.3)))

        # engagement_rate entre 0 et 1
        new_row["engagement_rate"] = min(
            1.0,
            max(0.0, row["engagement_rate"] * np.random.uniform(0.90, 1.10))
        )

        new_row["average_session_duration"] = max(
            0,
            row["average_session_duration"] * np.random.uniform(0.7, 1.3)
        )

        new_row["screen_page_views_per_user"] = max(
            0,
            row["screen_page_views_per_user"] * np.random.uniform(0.90, 1.15)
        )

        new_row["first_visit"] = max(0, round(row["first_visit"] * np.random.uniform(0.80, 1.20)))
        new_row["page_view"] = max(0, round(row["page_view"] * np.random.uniform(0.7, 1.3)))
        new_row["scroll"] = max(0, round(row["scroll"] * np.random.uniform(0.7, 1.3)))
        new_row["session_start"] = max(0, round(row["session_start"] * np.random.uniform(0.80, 1.20)))
        new_row["user_engagement"] = max(0, round(row["user_engagement"] * np.random.uniform(0.7, 1.3)))

        # -----------------------------
        # Zone grise (pages moyennes)
        # -----------------------------
        if np.random.rand() < 0.3:
            new_row["sessions"] = np.random.randint(5, 15)
            new_row["page_views"] = np.random.randint(10, 30)
            new_row["engagement_rate"] = np.random.uniform(0.4, 0.7)

        # -----------------------------
        # Incohérences réalistes
        # -----------------------------
        if np.random.rand() < 0.1:
            new_row["engagement_rate"] *= np.random.uniform(0.6, 0.9)

        # re-borner engagement_rate
        new_row["engagement_rate"] = min(1.0, max(0.0, new_row["engagement_rate"]))

        # cohérence logique
        if new_row["engaged_sessions"] > new_row["sessions"]:
            new_row["engaged_sessions"] = new_row["sessions"]

        # recalcul du label
        new_row["performance_label"] = int(
            (new_row["engagement_rate"] >= 0.5) and
            (new_row["sessions"] >= 10) and
            (new_row["page_views"] >= 20)
        )

        # bruit sur le label (5%)
        if np.random.rand() < 0.05:
            new_row["performance_label"] = 1 - new_row["performance_label"]

        new_rows.append(new_row)

# -----------------------------
# 3) Fusionner ancien + nouveau
# -----------------------------
df_new = pd.DataFrame(new_rows)
df_final = pd.concat([df, df_new], ignore_index=True)

# mélanger les lignes
df_final = df_final.sample(frac=1, random_state=42).reset_index(drop=True)

# -----------------------------
# 4) Sauvegarder le dataset final
# -----------------------------
df_final.to_csv("dataset_ga_final.csv", index=False)

print(" dataset_ga_final.csv créé")
print("Lignes initiales :", len(df))
print("Lignes ajoutées :", len(df_new))
print("Total final :", len(df_final))

print("\nDistribution du label :")
print(df_final["performance_label"].value_counts())

print("\nAperçu :")
print(df_final.head())