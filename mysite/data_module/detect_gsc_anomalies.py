import pandas as pd
from sklearn.ensemble import IsolationForest

# -----------------------------
# 1) Charger dataset GSC scoré
# -----------------------------
df = pd.read_csv("dataset_gsc_scored.csv")

# -----------------------------
# 2) Features pour anomalies
# -----------------------------
X = df[["clicks", "impressions", "ctr", "position", "visibility_score"]]

# -----------------------------
# 3) Modèle Isolation Forest
# -----------------------------
iso = IsolationForest(
    n_estimators=100,
    contamination=0.08,   # environ 8% anomalies
    random_state=42
)

iso.fit(X)

# -----------------------------
# 4) Détection
# -----------------------------
df["anomaly_flag"] = iso.predict(X)   # 1 normal, -1 anomalie
df["anomaly_score"] = iso.decision_function(X)

# pour lecture plus facile
df["anomaly_score"] = df["anomaly_score"].round(4)

# -----------------------------
# 5) Sauvegarde
# -----------------------------
df.to_csv("dataset_gsc_anomalies.csv", index=False)

print(" dataset_gsc_anomalies.csv créé")
print("\nDistribution anomalies :")
print(df["anomaly_flag"].value_counts())

print("\nExemples d'anomalies :")
print(df[df["anomaly_flag"] == -1].head(10))