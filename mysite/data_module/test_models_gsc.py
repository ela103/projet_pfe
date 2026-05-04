import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

# -----------------------------
# 1) Charger dataset
# -----------------------------
df = pd.read_csv("dataset_gsc_final.csv")

print("Dataset :", len(df), "lignes")

# -----------------------------
# 2) Features / Label
# -----------------------------
X = df[["clicks", "impressions", "ctr", "position"]]
y = df["visibility_label"]

# -----------------------------
# 3) Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# -----------------------------
# 4) Modèles
# -----------------------------
models = {
    "Logistic Regression": LogisticRegression(max_iter=1000),
    "Random Forest": RandomForestClassifier(),
    "XGBoost": XGBClassifier(eval_metric="logloss")
}

# -----------------------------
# 5) Test
# -----------------------------
for name, model in models.items():
    print("\n======================")
    print(name)

    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    print("Accuracy :", accuracy_score(y_test, y_pred))
    print(classification_report(y_test, y_pred))