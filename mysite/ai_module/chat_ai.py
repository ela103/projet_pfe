import random

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .ai_model import (
    analyse_data,
    predict_traffic,
    generate_recommendations,
    nlp_analysis
)


INTENT_EXAMPLES = {
    "kpi": [
        "donne moi les kpi",
        "affiche les clicks impressions ctr position",
        "montre la performance du site",
        "statistiques du trafic",
        "résumé des indicateurs",
        "analyse globale"
    ],
    "ga":[
        "analyse google analytics",
        "statistiques trafic",
        "sessions du site",
        "utilisateurs actifs"
],
"gsc":[
    "analyse seo",
    "search console",
    "clicks impressions",
    "position google"
],
    "prediction": [
        "fais une prévision du trafic",
        "prédis le trafic",
        "estime le trafic demain",
        "traffic futur",
        "forecast traffic",
        "combien de clicks demain"
    ],
    "recommendations": [
        "donne moi des recommandations seo",
        "comment améliorer le ctr",
        "conseils seo",
        "que dois-je optimiser",
        "amélioration du site",
        "actions à faire"
    ],
    "nlp": [
        "analyse les mots clés",
        "keywords principaux",
        "problèmes dans le title",
        "meta description",
        "analyse contenu",
        "seo on page"
    ]
}


def detect_intent_nlp(question: str) -> str:
    question = question.lower()

    all_sentences = []
    labels = []

    for intent, examples in INTENT_EXAMPLES.items():
        for ex in examples:
            all_sentences.append(ex)
            labels.append(intent)

    vectorizer = TfidfVectorizer()
    X = vectorizer.fit_transform(all_sentences + [question])

    question_vec = X[-1]
    examples_vec = X[:-1]

    sims = cosine_similarity(question_vec, examples_vec)[0]
    best_index = sims.argmax()

    best_intent = labels[best_index]
    best_score = sims[best_index]

    if best_score < 0.15:
        return "unknown"

    return best_intent


def chat_greetings_farewells(question: str):
    q = question.lower()

    greetings = ["bonjour", "salut", "hello", "hi", "coucou"]
    farewells = ["au revoir", "bye", "à bientôt", "ciao"]

    for word in greetings:
        if word in q:
            return "greeting"

    for word in farewells:
        if word in q:
            return "farewell"

    return None


def polite_intro(intent: str):
    intros = {
        "kpi": [
            "Voici les KPI que j'ai pu calculer :",
            "Voici un résumé des indicateurs :"
        ],
        "prediction": [
            "Voici la prévision du trafic :",
            "Voici ce que je prévois pour le trafic :"
        ],
        "recommendations": [
            "Voici mes recommandations SEO :",
            "Suggestions pour améliorer votre site :"
        ],
        "nlp": [
            "Analyse du contenu et des mots-clés :",
            "Voici ce que j'ai trouvé concernant le contenu :"
        ]
    }
    return random.choice(intros.get(intent, ["Voici la réponse :"]))


def format_response(intent, data):
    if intent == "prediction":
        text = "Prévision du trafic :\n\n"
        for row in data:
            text += (
                f"- {row['page']} : {row['predicted_clicks']} clics, "
                f"{row['predicted_impressions']} impressions\n"
            )
        return text

    if intent == "kpi":
        seo = data["seo"]
        traffic = data["traffic"]

        return (
            "KPI globaux :\n\n"
            "SEO (Google Search Console) :\n"
            f"- Total Clicks : {seo['total_clicks']}\n"
            f"- Total Impressions : {seo['total_impressions']}\n"
            f"- CTR moyen : {seo['avg_ctr'] * 100:.2f}%\n"
            f"- Position moyenne : {seo['avg_position']}\n\n"
            "Trafic (Google Analytics) :\n"
            f"- Utilisateurs actifs : {traffic['total_active_users']}\n"
            f"- Sessions : {traffic['total_sessions']}\n"
            f"- Pages vues : {traffic['total_page_views']}\n"
        )

    if intent == "recommendations":
        text = "Recommandations SEO :\n\n"
        for rec in data:
            text += f"- {rec}\n"
        return text

    if intent == "nlp":
        text = "Analyse NLP du contenu :\n\n"
        for page_data in data:
            text += f"Page : {page_data['page']}\n"
            text += f"Mots-clés : {', '.join(page_data['top_keywords'])}\n"
            if page_data["issues"]:
                text += "Problèmes : " + ", ".join(page_data["issues"]) + "\n"
            if page_data["recommendations"]:
                text += "Recommandations : " + ", ".join(page_data["recommendations"]) + "\n"
            text += "\n"
        return text

    return "Je n’ai pas compris la question."


def ask_ai(question: str):
    special_intent = chat_greetings_farewells(question)

    if special_intent == "greeting":
        return {
            "intent": "greeting",
            "text": "Bonjour. Comment puis-je vous aider concernant le SEO ou le trafic du site ?",
            "data": None
        }

    if special_intent == "farewell":
        return {
            "intent": "farewell",
            "text": "Au revoir et bonne journée.",
            "data": None
        }

    intent = detect_intent_nlp(question)

    if intent == "kpi":
        data = analyse_data()
    elif intent == "prediction":
        data = predict_traffic(days_ahead=1)
    elif intent == "recommendations":
        data = generate_recommendations()
    elif intent == "nlp":
        data = nlp_analysis()
    else:
        return {
            "intent": "unknown",
            "text": "Je n’ai pas compris la question. Essayez une question sur les KPI, la prévision, les recommandations ou l’analyse du contenu.",
            "data": None
        }

    intro = polite_intro(intent)
    text = f"{intro}\n\n{format_response(intent, data)}"

    return {
        "intent": intent,
        "text": text,
        "data": data
    }