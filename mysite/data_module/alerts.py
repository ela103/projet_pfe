import smtplib
from email.mime.text import MIMEText
from django.conf import settings


def send_pipeline_error_email(error_message):
    subject = "Erreur pipeline ETL GA4/GSC"
    body = f"""
Le pipeline automatique GA4/GSC a échoué.
Détail de l'erreur :
{error_message}
"""

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_HOST_USER
    msg["To"] = settings.ALERT_EMAIL

    with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
        server.starttls()
        server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
        server.send_message(msg)