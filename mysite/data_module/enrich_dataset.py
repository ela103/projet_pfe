import pandas as pd
import numpy as np

# charger dataset réel
df = pd.read_csv("dataset_scrapping.csv")

synthetic_rows = []

for _, row in df.iterrows():
    for i in range(50):  # 5 lignes simulées par ligne réelle
        new_row = row.copy()

        # variations réalistes
        new_row["title_length"] = int(row["title_length"] * np.random.uniform(0.9, 1.1))
        new_row["meta_description_length"] = int(row["meta_description_length"] * np.random.uniform(0.9, 1.1))
        new_row["word_count"] = int(row["word_count"] * np.random.uniform(0.8, 1.2))
        new_row["images_count"] = max(0, int(row["images_count"] + np.random.randint(-2, 3)))
        new_row["images_without_alt"] = max(0, int(row["images_without_alt"] + np.random.randint(-1, 2)))
        new_row["internal_links_count"] = max(0, int(row["internal_links_count"] + np.random.randint(-3, 4)))
        new_row["response_time_ms"] = max(50, int(row["response_time_ms"] * np.random.uniform(0.8, 1.3)))

        # variation du score
        new_row["technical_score_target"] = max(
            0, min(100, int(row["technical_score_target"] + np.random.randint(-5, 6)))
        )

        # marquer comme enrichi
        new_row["is_synthetic"] = 1

        synthetic_rows.append(new_row)

# créer dataframe simulé
df_synthetic = pd.DataFrame(synthetic_rows)

# fusion réel + enrichi
df_final = pd.concat([df, df_synthetic], ignore_index=True)

# 🔥 écraser le fichier original
df_final.to_csv("dataset_scrapping.csv", index=False)

print("✅ Dataset enrichi avec succès")
print("Lignes réelles :", len(df))
print("Lignes ajoutées :", len(df_synthetic))
print("Total final :", len(df_final))

print("\nAperçu :")
print(df_final.head())