import pandas as pd
from xgboost import XGBClassifier

# -----------------------------
# 1) Charger dataset
# -----------------------------
df = pd.read_csv("dataset_ga_final.csv")

# -----------------------------
# 2) Features / Target
# -----------------------------
X = df.drop(columns=["website_id", "page_path", "performance_label"])
y = df["performance_label"]

# -----------------------------
# 3) Entraîner modèle XGBoost
# -----------------------------
model = XGBClassifier(eval_metric="logloss")
model.fit(X, y)

# -----------------------------
# 4) Générer probabilités
# -----------------------------
proba = model.predict_proba(X)[:, 1]

# -----------------------------
# 5) Créer score
# -----------------------------
df["performance_score"] = (proba ** 0.7 * 100).round(2)

# -----------------------------
# 6) Sauvegarder
# -----------------------------
df.to_csv("dataset_ga_scored.csv", index=False)

print(" dataset_ga_scored.csv créé")

print("\nAperçu :")
print(df[["page_path", "performance_score"]].head())