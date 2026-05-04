import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

from sklearn.linear_model import LinearRegression
from xgboost import XGBRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor

# Charger dataset
df = pd.read_csv("dataset_scrapping.csv")

# 🔥 nettoyage
df = df.fillna(0)
df = df[df["word_count"] > 50]
df = df[(df["technical_score_target"] >= 0) & (df["technical_score_target"] <= 100)]

# Features / target
X = df.drop(columns=[
    "technical_score_target",
    "url",
    "website_id",
    "status_code",
    "is_synthetic"
])
y = df["technical_score_target"]

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 🔥 modèles à tester
models = {
    "Linear Regression": LinearRegression(),
    "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42),
    "Gradient Boosting": GradientBoostingRegressor(random_state=42),
    "XGBoost": XGBRegressor(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        random_state=42)
}

results = []

print("\n Résultats des modèles :\n")

for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    results.append((name, mae, r2))

    print(f"{name}")
    print(f"MAE: {mae:.4f}")
    print(f"R2 : {r2:.4f}")
    print("-" * 30)

# 🔥 classement final
results_df = pd.DataFrame(results, columns=["Model", "MAE", "R2"])

print("\n Classement des modèles :\n")
print(results_df.sort_values(by="MAE"))