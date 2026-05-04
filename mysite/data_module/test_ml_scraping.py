import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

# Charger dataset
df = pd.read_csv("dataset_scrapping.csv")

print(" Dataset chargé")
print("Nombre de lignes avant nettoyage :", len(df))

# 🔥 Nettoyage final
df = df.fillna(0)
df = df[df["word_count"] > 50]
df = df[(df["technical_score_target"] >= 0) & (df["technical_score_target"] <= 100)]

print("Nombre de lignes après nettoyage :", len(df))
print(df.head())

# Features / target
X = df.drop(columns=[
    "technical_score_target",
    "url",
    "website_id",
    "status_code"
])
y = df["technical_score_target"]

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Modèle
model = RandomForestRegressor(n_estimators=100, random_state=42)

# Entraînement
model.fit(X_train, y_train)

# Prédictions
y_pred = model.predict(X_test)

# Évaluation
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print("\n Résultats du modèle")
print("MAE :", round(mae, 4))
print("R2  :", round(r2, 4))

# Comparaison réel vs prédit
results = pd.DataFrame({
    "Valeur réelle": y_test.values,
    "Prédiction": y_pred
})

print("\n Comparaison")
print(results.head())

# Importance des variables
importance = pd.DataFrame({
    "Feature": X.columns,
    "Importance": model.feature_importances_
}).sort_values(by="Importance", ascending=False)

print("\n Importance des variables")
print(importance)