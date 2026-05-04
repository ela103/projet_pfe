import pandas as pd
from sklearn.ensemble import RandomForestClassifier

# -----------------------------
# 1) Charger dataset GSC final
# -----------------------------
df = pd.read_csv("dataset_gsc_final.csv")

print("Dataset chargé :", len(df), "lignes")

# -----------------------------
# 2) Features / Label
# -----------------------------
X = df[["clicks", "impressions", "ctr", "position"]]
y = df["visibility_label"]

# -----------------------------
# 3) Entraîner le modèle final
# -----------------------------
model = RandomForestClassifier(random_state=42)
model.fit(X, y)

print("Modèle entraîné ✔")

# -----------------------------
# 4) Générer les probabilités
# -----------------------------
proba = model.predict_proba(X)[:, 1]

# -----------------------------
# 5) Transformer en score (0 → 100)
# -----------------------------
df["visibility_score"] = (proba * 100).round(2)

# -----------------------------
# 6) Sauvegarder
# -----------------------------
df.to_csv("dataset_gsc_scored.csv", index=False)

print(" dataset_gsc_scored.csv créé")

# -----------------------------
# 7) Aperçu
# -----------------------------
print("\nAperçu :")
print(df[["page", "visibility_label", "visibility_score"]].head())