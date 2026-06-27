import smtplib
from email.mime.text import MIMEText

from django.conf import settings


def send_pipeline_error_email(
    error_message,
    subject="Alerte ETL - Échec du pipeline GA4/GSC",
    intro="Le pipeline automatique GA4/GSC a échoué.",
):
    body = f"""
{intro}

Détail de l'erreur :
{error_message}
"""

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_HOST_USER
    msg["To"] = settings.ALERT_EMAIL

    with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
        server.send_message(msg)
