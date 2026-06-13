import re
from html import escape

from .chat_ai import ask_ai
from .ai_model import analyse_data, generate_recommendations, get_anomalies, get_weak_pages
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import EmailMultiAlternatives, send_mail

from data_module.models import Website, Notification


def generate_weekly_seo_summary(website_id=None):
    period = "week"

    kpi = analyse_data(website_id=website_id, period=period)
    recommendations = generate_recommendations(website_id=website_id, period=period)
    anomalies = get_anomalies(website_id=website_id)
    weak_pages = get_weak_pages(website_id=website_id)

    question = f"""
Tu es un analyste SEO. Rédige uniquement un résumé hebdomadaire
très court à partir des données fournies.

Données SEO :
{kpi.get("seo")}

Données trafic :
{kpi.get("traffic")}

Recommandations :
{recommendations[:2]}

Anomalies :
{anomalies[:2]}

Pages faibles :
{weak_pages[:2]}

Règles obligatoires :
- Répondre uniquement avec le résumé final.
- Deux phrases maximum.
- Première phrase : constat principal fondé sur les données.
- Deuxième phrase : recommandation prioritaire.
- Ne pas écrire de titre.
- Ne pas utiliser de liste.
- Ne pas saluer.
- Ne pas poser de question.
- Ne pas recopier tous les KPI.
- Ne pas produire de HTML ni de Markdown.
- Si les données sont insuffisantes, répondre exactement :
  Pas de données suffisantes pour établir un bilan cette semaine.
- Ton professionnel, direct et concis.
"""
    result = ask_ai(question, website_id, period)

    if isinstance(result, dict):
        summary_text = (
            result.get("text")
            or result.get("response")
            or result.get("answer")
            or str(result)
        )
    else:
        summary_text = str(result)

    return {
        "title": "Résumé hebdomadaire SEO",
        "website_id": website_id,
        "period": period,
        "summary": summary_text,
        "kpi": kpi,
        "recommendations": recommendations,
        "anomalies": anomalies,
        "weak_pages": weak_pages,
    }

User = get_user_model()
def clean_ai_summary(summary_text):
    default_message = (
        "Pas de données suffisantes pour établir "
        "un bilan cette semaine."
    )

    if not summary_text:
        return default_message

    summary_text = str(summary_text).strip()

    # Retirer les éventuelles balises retournées par l'IA
    summary_text = re.sub(r"<[^>]+>", " ", summary_text)

    # Normaliser les espaces
    summary_text = re.sub(r"\s+", " ", summary_text).strip()

    invalid_responses = (
        "comment puis-je vous aider",
        "résumé des indicateurs clés",
        "kpi globaux",
    )

    normalized_text = summary_text.lower()

    if any(
        invalid_response in normalized_text
        for invalid_response in invalid_responses
    ):
        return default_message

    if len(summary_text) > 500:
        summary_text = (
            summary_text[:500].rsplit(" ", 1)[0] + "…"
        )

    return summary_text

def run_weekly_seo_summaries():
    """
    Génère un résumé court pour chaque site,
    regroupe les résultats dans un e-mail HTML
    et crée une notification globale.
    """

    websites = Website.objects.all().order_by("name")

    if not websites.exists():
        print("Aucun site disponible pour le résumé hebdomadaire.")
        return

    admin_emails = list(
        User.objects.filter(
            is_active=True,
            is_staff=True,
        )
        .exclude(email="")
        .values_list("email", flat=True)
    )

    summaries = []
    errors = []

    for website in websites:
        try:
            result = generate_weekly_seo_summary(
                website_id=website.id
            )

            summary_text = clean_ai_summary(
                result.get("summary", "")
            )

            summaries.append({
                "website_name": website.name,
                "summary": summary_text,
            })

            print(f"Résumé généré pour : {website.name}")

        except Exception as error:
            errors.append({
                "website_name": website.name,
                "error": str(error),
            })

            print(
                f"Erreur pour le site "
                f"{website.id} - {website.name} : {error!r}"
            )

    if not summaries:
        Notification.objects.create(
            title="Erreur résumés hebdomadaires SEO",
            message="Aucun résumé hebdomadaire n’a pu être généré.",
            level="error",
            source="weekly_summary",
            is_read=False,
        )
        return

    # -------------------------------------------------
    # Version texte, utilisée si le HTML n'est pas accepté
    # -------------------------------------------------

    text_sections = []

    for item in summaries:
        text_sections.append(
            f"{item['website_name']}\n"
            f"{item['summary']}"
        )

    email_body_text = (
        "Bonjour,\n\n"
        "Voici le résumé SEO hebdomadaire "
        "de l’ensemble des sites.\n\n"
        + "\n\n".join(text_sections)
        + "\n\nCordialement,\n"
        "Votre plateforme SEO"
    )

    # -------------------------------------------------
    # Cartes HTML de chaque site
    # -------------------------------------------------

    html_sections = []

    for index, item in enumerate(summaries, start=1):
        website_name = escape(item["website_name"])
        summary = escape(item["summary"])

        html_sections.append(
            f"""
            <tr>
                <td style="padding: 0 32px 18px 32px;">
                    <table
                        role="presentation"
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        style="
                            background-color: #ffffff;
                            border: 1px solid #e5e7eb;
                            border-radius: 16px;
                            border-collapse: separate;
                            box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
                        "
                    >
                        <tr>
                            <td style="padding: 22px;">
                                <table
                                    role="presentation"
                                    width="100%"
                                    cellpadding="0"
                                    cellspacing="0"
                                >
                                    <tr>
                                        <td
                                            width="44"
                                            valign="top"
                                            style="padding-right: 14px;"
                                        >
                                            <div
                                                style="
                                                    width: 42px;
                                                    height: 42px;
                                                    line-height: 42px;
                                                    border-radius: 12px;
                                                    background-color: #eef2ff;
                                                    color: #4f46e5;
                                                    text-align: center;
                                                    font-size: 16px;
                                                    font-weight: 700;
                                                "
                                            >
                                                {index}
                                            </div>
                                        </td>

                                        <td valign="top">
                                            <div
                                                style="
                                                    margin-bottom: 8px;
                                                    color: #111827;
                                                    font-size: 17px;
                                                    font-weight: 700;
                                                    line-height: 1.3;
                                                "
                                            >
                                                {website_name}
                                            </div>

                                            <div
                                                style="
                                                    color: #4b5563;
                                                    font-size: 14px;
                                                    line-height: 1.7;
                                                "
                                            >
                                                {summary}
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            """
        )

    errors_html = ""

    if errors:
        error_items = "".join(
            (
                "<li style='margin-bottom: 6px;'>"
                f"{escape(item['website_name'])} : "
                "analyse indisponible"
                "</li>"
            )
            for item in errors
        )

        errors_html = f"""
        <tr>
            <td style="padding: 4px 32px 24px 32px;">
                <table
                    role="presentation"
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                        background-color: #fff7ed;
                        border: 1px solid #fed7aa;
                        border-radius: 14px;
                        border-collapse: separate;
                    "
                >
                    <tr>
                        <td style="padding: 18px 20px;">
                            <div
                                style="
                                    margin-bottom: 8px;
                                    color: #9a3412;
                                    font-size: 14px;
                                    font-weight: 700;
                                "
                            >
                                Analyses indisponibles
                            </div>

                            <ul
                                style="
                                    margin: 0;
                                    padding-left: 18px;
                                    color: #9a3412;
                                    font-size: 13px;
                                    line-height: 1.5;
                                "
                            >
                                {error_items}
                            </ul>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        """

    sites_count = len(summaries)

    email_body_html = f"""
    <!doctype html>
    <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >
            <title>Résumé hebdomadaire SEO</title>
        </head>

        <body
            style="
                margin: 0;
                padding: 0;
                background-color: #f1f5f9;
                font-family: Arial, Helvetica, sans-serif;
            "
        >
            <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="background-color: #f1f5f9;"
            >
                <tr>
                    <td align="center" style="padding: 32px 12px;">
                        <table
                            role="presentation"
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            style="
                                max-width: 720px;
                                background-color: #f8fafc;
                                border-radius: 24px;
                                overflow: hidden;
                                border-collapse: separate;
                                box-shadow:
                                    0 14px 40px rgba(15, 23, 42, 0.12);
                            "
                        >
                            <!-- En-tête -->
                            <tr>
                                <td
                                    style="
                                        padding: 38px 32px;
                                        background-color: #4f46e5;
                                        background-image:
                                            linear-gradient(
                                                135deg,
                                                #2563eb 0%,
                                                #4f46e5 52%,
                                                #7c3aed 100%
                                            );
                                        color: #ffffff;
                                    "
                                >
                                    <div
                                        style="
                                            margin-bottom: 10px;
                                            font-size: 12px;
                                            font-weight: 700;
                                            letter-spacing: 1.4px;
                                            text-transform: uppercase;
                                            opacity: 0.85;
                                        "
                                    >
                                        Rapport automatique
                                    </div>

                                    <div
                                        style="
                                            margin-bottom: 12px;
                                            font-size: 28px;
                                            font-weight: 800;
                                            line-height: 1.2;
                                        "
                                    >
                                        Résumé hebdomadaire SEO
                                    </div>

                                    <div
                                        style="
                                            max-width: 560px;
                                            font-size: 15px;
                                            line-height: 1.7;
                                            opacity: 0.92;
                                        "
                                    >
                                        Une vue concise des performances et
                                        des priorités de l’ensemble de vos sites.
                                    </div>
                                </td>
                            </tr>

                            <!-- Introduction -->
                            <tr>
                                <td style="padding: 28px 32px 22px 32px;">
                                    <table
                                        role="presentation"
                                        width="100%"
                                        cellpadding="0"
                                        cellspacing="0"
                                    >
                                        <tr>
                                            <td>
                                                <div
                                                    style="
                                                        margin-bottom: 7px;
                                                        color: #111827;
                                                        font-size: 18px;
                                                        font-weight: 700;
                                                    "
                                                >
                                                    Bonjour,
                                                </div>

                                                <div
                                                    style="
                                                        color: #64748b;
                                                        font-size: 14px;
                                                        line-height: 1.7;
                                                    "
                                                >
                                                    Voici les points essentiels
                                                    relevés cette semaine pour
                                                    {sites_count} site(s).
                                                </div>
                                            </td>

                                            <td
                                                align="right"
                                                valign="middle"
                                                style="padding-left: 14px;"
                                            >
                                                <div
                                                    style="
                                                        display: inline-block;
                                                        padding: 9px 14px;
                                                        border-radius: 999px;
                                                        background-color: #e0e7ff;
                                                        color: #4338ca;
                                                        font-size: 12px;
                                                        font-weight: 700;
                                                        white-space: nowrap;
                                                    "
                                                >
                                                    {sites_count} sites analysés
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            {''.join(html_sections)}

                            {errors_html}

                            <!-- Pied de page -->
                            <tr>
                                <td style="padding: 10px 32px 34px 32px;">
                                    <table
                                        role="presentation"
                                        width="100%"
                                        cellpadding="0"
                                        cellspacing="0"
                                        style="
                                            border-top: 1px solid #e2e8f0;
                                        "
                                    >
                                        <tr>
                                            <td style="padding-top: 24px;">
                                                <div
                                                    style="
                                                        margin-bottom: 6px;
                                                        color: #334155;
                                                        font-size: 14px;
                                                        font-weight: 700;
                                                    "
                                                >
                                                    Votre plateforme SEO
                                                </div>

                                                <div
                                                    style="
                                                        color: #94a3b8;
                                                        font-size: 12px;
                                                        line-height: 1.6;
                                                    "
                                                >
                                                    Ce rapport a été généré
                                                    automatiquement.
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
    </html>
    """

    email_subject = "Résumé hebdomadaire SEO — Tous les sites"

    notification_message = (
        f"Le résumé hebdomadaire de {len(summaries)} site(s) "
        "a été généré et envoyé par e-mail."
    )

    if errors:
        notification_message += (
            f" {len(errors)} site(s) n’ont pas pu être analysés."
        )

    # -------------------------------------------------
    # Envoyer l'e-mail HTML
    # -------------------------------------------------

    if admin_emails:
        email = EmailMultiAlternatives(
            subject=email_subject,
            body=email_body_text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=admin_emails,
        )

        email.attach_alternative(
            email_body_html,
            "text/html",
        )

        email.send(fail_silently=False)

        Notification.objects.create(
            title="Résumé hebdomadaire SEO",
            message=email_body_text,
            level="warning" if errors else "info",
            source="weekly_summary",
            is_read=False,
        )

        print(
            "E-mail HTML global envoyé à : "
            + ", ".join(admin_emails)
        )

    else:
        Notification.objects.create(
            title="Résumé hebdomadaire SEO non envoyé",
            message=(
                "Le résumé a été généré, mais aucune adresse "
                "d’administrateur active n’a été trouvée."
            ),
            level="warning",
            source="weekly_summary",
            is_read=False,
        )

        print(
            "Aucun administrateur actif "
            "avec une adresse e-mail."
        )