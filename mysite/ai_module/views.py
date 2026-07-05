import json
import os

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

from .ai_model import analyse_data, generate_recommendations, predict_traffic, nlp_analysis,calculate_site_score
from .chat_ai import ask_ai
from django.views.decorators.http import require_GET
from .weekly_summary import generate_weekly_seo_summary

import json
import re

from datetime import datetime
from io import BytesIO
from xml.sax.saxutils import escape

from django.http import HttpResponse, JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Flowable,
    HRFlowable,
    Image as ReportLabImage,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from data_module.models import Website
from .models import AIChatMessage, AIRecommendation


class SmartSEOLogoFlowable(Flowable):
    def __init__(self, width=48 * mm, height=18 * mm):
        super().__init__()
        self.width = width
        self.height = height

    def wrap(self, available_width, available_height):
        return self.width, self.height

    def draw(self):
        canvas = self.canv
        canvas.saveState()

        mark_x = 1.5 * mm
        mark_y = 2.2 * mm
        scale = self.height / (18 * mm)

        ring_x = mark_x + 7.4 * mm * scale
        ring_y = mark_y + 8.6 * mm * scale
        ring_r = 5.3 * mm * scale

        violet = colors.HexColor("#8B5CF6")
        indigo = colors.HexColor("#315CFF")
        cyan = colors.HexColor("#18C7E8")
        teal = colors.HexColor("#20D6C7")
        navy = colors.HexColor("#1A2754")

        canvas.setLineCap(1)
        canvas.setStrokeColor(violet)
        canvas.setLineWidth(1.4 * mm * scale)
        canvas.circle(ring_x, ring_y, ring_r, stroke=1, fill=0)

        bars = [
            (ring_x - 3.2 * mm * scale, ring_y - 3.4 * mm * scale, 2.0 * mm * scale, navy),
            (ring_x - 1.0 * mm * scale, ring_y - 3.4 * mm * scale, 4.1 * mm * scale, indigo),
            (ring_x + 1.2 * mm * scale, ring_y - 3.4 * mm * scale, 5.9 * mm * scale, violet),
            (ring_x + 3.4 * mm * scale, ring_y - 3.4 * mm * scale, 7.2 * mm * scale, teal),
        ]

        for x, y, h, color in bars:
            canvas.setStrokeColor(color)
            canvas.setLineWidth(1.15 * mm * scale)
            canvas.line(x, y, x, y + h)

        canvas.setStrokeColor(violet)
        canvas.setLineWidth(1.0 * mm * scale)
        path = canvas.beginPath()
        path.moveTo(ring_x - 4.1 * mm * scale, ring_y + 0.5 * mm * scale)
        path.lineTo(ring_x - 1.6 * mm * scale, ring_y + 2.5 * mm * scale)
        path.lineTo(ring_x + 0.6 * mm * scale, ring_y + 1.0 * mm * scale)
        path.lineTo(ring_x + 3.9 * mm * scale, ring_y + 4.0 * mm * scale)
        canvas.drawPath(path, stroke=1, fill=0)

        canvas.setStrokeColor(indigo)
        canvas.setLineWidth(1.25 * mm * scale)
        canvas.line(
            ring_x + 4.2 * mm * scale,
            ring_y - 4.4 * mm * scale,
            ring_x + 8.0 * mm * scale,
            ring_y - 8.2 * mm * scale,
        )

        text_x = mark_x + 20 * mm * scale
        text_y = mark_y + 5.8 * mm * scale

        canvas.setFont("Helvetica-Bold", 12.5 * scale)
        canvas.setFillColor(colors.HexColor("#172033"))
        canvas.drawString(text_x, text_y, "Smart")
        canvas.setFillColor(violet)
        canvas.drawString(text_x + 17.7 * mm * scale, text_y, "SEO")

        canvas.restoreState()


def test_ai(request):
    pages = nlp_analysis()
    site = calculate_site_score()

    result = {
        "analysis": analyse_data(),
        "recommendations": generate_recommendations(),
        "prediction": predict_traffic(days_ahead=1),
        "pages": pages,
        "site": site
    }

    return JsonResponse(result)


@csrf_exempt
def ai_chat(request):
    if request.method == "POST":
        data = json.loads(request.body.decode("utf-8"))

        question = data.get("question") or data.get("message", "")
        website_id = data.get("website_id")
        period = data.get("period", "all")
        tool = data.get("tool", "")
        channel = data.get("channel", "")

        print("website_id reçu :", website_id)
        print("period reçu :", period)

        result = ask_ai(question, website_id, period, channel=channel)

        saved_recommendation_id = None
        recommendation_save_reason = ""
        result_intent = result.get("intent", "") if isinstance(result, dict) else ""
        should_store_recommendation = (
            tool == "recommendations"
            or result_intent == "recommendations"
            or "recommandation" in question.lower()
            or "recommendation" in question.lower()
        )

        if not should_store_recommendation:
            recommendation_save_reason = "not_recommendations_tool"
        elif not website_id:
            recommendation_save_reason = "missing_website_id"
        elif not result:
            recommendation_save_reason = "empty_ai_result"
        else:
            try:
                website = Website.objects.get(id=website_id)
                user = request.user if request.user.is_authenticated else None
                text = str(result.get("text", "")).strip()

                if text:
                    recommendation = AIRecommendation.objects.create(
                        user=user,
                        website=website,
                        tool=tool or "recommendations",
                        period=period or "all",
                        question=question,
                        content=text,
                        source=str(result.get("source", "") or ""),
                        used_rag=bool(result.get("used_rag")),
                        retrieved_documents_count=int(
                            result.get("retrieved_documents_count") or 0
                        ),
                    )
                    saved_recommendation_id = recommendation.id
                    recommendation_save_reason = "saved"
                else:
                    recommendation_save_reason = "empty_ai_text"
            except Website.DoesNotExist:
                recommendation_save_reason = "website_not_found"

        saved_chat_message_id = None
        chat_message_save_reason = ""
        should_store_chat_message = channel == "chatbot"

        if not should_store_chat_message:
            chat_message_save_reason = "not_chatbot_channel"
        elif not request.user.is_authenticated:
            chat_message_save_reason = "anonymous_user"
        elif not question.strip():
            chat_message_save_reason = "empty_question"
        elif not isinstance(result, dict) or not str(result.get("text", "")).strip():
            chat_message_save_reason = "empty_ai_answer"
        else:
            website = None

            if website_id:
                website = Website.objects.filter(id=website_id).first()

            chat_message = AIChatMessage.objects.create(
                user=request.user,
                website=website,
                question=question,
                answer=str(result.get("text", "")).strip(),
                intent=str(result.get("intent", "") or ""),
                source=str(result.get("source", "") or ""),
                used_rag=bool(result.get("used_rag")),
                retrieved_documents_count=int(
                    result.get("retrieved_documents_count") or 0
                ),
            )
            saved_chat_message_id = chat_message.id
            chat_message_save_reason = "saved"

        return JsonResponse({
            "response": result,
            "recommendation_saved": bool(saved_recommendation_id),
            "recommendation_id": saved_recommendation_id,
            "recommendation_save_reason": recommendation_save_reason,
            "chat_message_saved": bool(saved_chat_message_id),
            "chat_message_id": saved_chat_message_id,
            "chat_message_save_reason": chat_message_save_reason,
            "recommendation_debug": {
                "tool": tool,
                "question": question,
                "intent": result_intent,
                "website_id": website_id,
            },
        })

    return JsonResponse({"error": "POST only"})


@require_GET
def ai_chat_history(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {
                "success": False,
                "error": "Authentification requise.",
            },
            status=401,
        )

    website_id = request.GET.get("website_id")

    messages = AIChatMessage.objects.select_related(
        "website",
        "user",
    ).filter(user=request.user)

    if website_id:
        messages = messages.filter(website_id=website_id)

    data = []
    for message in messages.order_by("-created_at")[:100]:
        data.append({
            "id": message.id,
            "website_id": message.website_id,
            "website_name": message.website.name if message.website else "",
            "question": message.question,
            "answer": message.answer,
            "intent": message.intent,
            "source": message.source,
            "used_rag": message.used_rag,
            "retrieved_documents_count": message.retrieved_documents_count,
            "created_at": message.created_at.isoformat(),
        })

    return JsonResponse({
        "success": True,
        "messages": data,
    })


@require_GET
def ai_recommendations_history(request):
    website_id = request.GET.get("website_id")
    period = request.GET.get("period")
    status = request.GET.get("status")

    recommendations = AIRecommendation.objects.select_related(
        "website",
        "user",
    ).all()

    if website_id:
        recommendations = recommendations.filter(website_id=website_id)

    if period:
        recommendations = recommendations.filter(period=period)

    if status:
        recommendations = recommendations.filter(status=status)

    data = []
    for recommendation in recommendations[:100]:
        data.append({
            "id": recommendation.id,
            "website_id": recommendation.website_id,
            "website_name": recommendation.website.name,
            "user_id": recommendation.user_id,
            "user_email": recommendation.user.email if recommendation.user else "",
            "tool": recommendation.tool,
            "period": recommendation.period,
            "question": recommendation.question,
            "content": recommendation.content,
            "source": recommendation.source,
            "used_rag": recommendation.used_rag,
            "retrieved_documents_count": recommendation.retrieved_documents_count,
            "status": recommendation.status,
            "created_at": recommendation.created_at.isoformat(),
            "updated_at": recommendation.updated_at.isoformat(),
        })

    return JsonResponse({
        "success": True,
        "recommendations": data,
    })



def _export_ai_text_pdf(
    request,
    *,
    content_key,
    empty_message,
    document_title,
    document_subject,
    report_title,
    report_subtitle,
    section_title,
    filename,
):
    try:
        data = json.loads(request.body.decode("utf-8"))

        analysis = str(data.get(content_key, data.get("analysis", ""))).strip()
        website_name = str(
            data.get("website_name", "Site sélectionné")
        ).strip()
        website_id = data.get("website_id")
        period = str(data.get("period", "all")).strip()

        if website_id:
            try:
                website = Website.objects.get(id=website_id)
                website_name = website.name
            except Website.DoesNotExist:
                pass

        if not analysis:
            return JsonResponse(
                {"error": empty_message},
                status=400,
            )

        period_labels = {
            "today": "Aujourd’hui",
            "day": "Aujourd’hui",
            "7d": "7 derniers jours",
            "week": "7 derniers jours",
            "30d": "30 derniers jours",
            "month": "30 derniers jours",
            "90d": "90 derniers jours",
            "year": "12 derniers mois",
            "all": "Toutes les données",
        }

        period_labels.update({
            "today": "Jour sélectionné",
            "day": "Jour sélectionné",
            "7d": "Semaine sélectionnée",
            "week": "Semaine sélectionnée",
            "30d": "Mois sélectionné",
            "month": "Mois sélectionné",
            "all": "Vue globale",
        })

        period_label = period_labels.get(period, period)
        generated_at = datetime.now().strftime("%d/%m/%Y à %H:%M")

        buffer = BytesIO()

        page_width, page_height = A4

        left_margin = 16 * mm
        right_margin = 16 * mm
        top_margin = 17 * mm
        bottom_margin = 18 * mm

        content_width = (
            page_width
            - left_margin
            - right_margin
        )

        document = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=left_margin,
            rightMargin=right_margin,
            topMargin=top_margin,
            bottomMargin=bottom_margin,
            title=document_title,
            author="SmartSEO",
            subject=document_subject,
        )

        styles = getSampleStyleSheet()

        # Couleurs du rapport
        brand_primary = colors.HexColor("#315CFF")
        brand_secondary = colors.HexColor("#7B5CFF")
        dark_text = colors.HexColor("#172033")
        body_text = colors.HexColor("#475569")
        muted_text = colors.HexColor("#64748B")
        light_border = colors.HexColor("#E2E8F0")
        soft_background = colors.HexColor("#F8FAFC")
        analysis_background = colors.HexColor("#F4F6FF")
        analysis_border = colors.HexColor("#D8DDFE")

        # Styles
        brand_style = ParagraphStyle(
            name="BrandLabel",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=brand_primary,
            spaceAfter=2 * mm,
        )

        title_style = ParagraphStyle(
            name="ReportTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            alignment=TA_LEFT,
            textColor=dark_text,
            spaceAfter=1 * mm,
        )

        subtitle_style = ParagraphStyle(
            name="ReportSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9.3,
            leading=13,
            alignment=TA_LEFT,
            textColor=brand_secondary,
        )

        info_label_style = ParagraphStyle(
            name="InfoLabel",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            textColor=muted_text,
            spaceAfter=1 * mm,
        )

        info_value_style = ParagraphStyle(
            name="InfoValue",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=dark_text,
        )

        section_title_style = ParagraphStyle(
            name="SectionTitle",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=17,
            textColor=dark_text,
            spaceAfter=3 * mm,
        )

        analysis_heading_style = ParagraphStyle(
            name="AnalysisHeading",
            parent=styles["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=11.3,
            leading=15,
            textColor=brand_secondary,
            spaceBefore=3 * mm,
            spaceAfter=2 * mm,
            leftIndent=4 * mm,
            rightIndent=4 * mm,
        )

        analysis_body_style = ParagraphStyle(
            name="AnalysisBody",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.3,
            leading=14,
            alignment=TA_LEFT,
            textColor=body_text,
            spaceAfter=2.5 * mm,
            splitLongWords=True,
        )

        analysis_bullet_style = ParagraphStyle(
            name="AnalysisBullet",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.1,
            leading=13.5,
            textColor=body_text,
            leftIndent=8 * mm,
            firstLineIndent=-4 * mm,
            bulletIndent=3 * mm,
            spaceAfter=1.5 * mm,
        )

        footer_style = ParagraphStyle(
            name="Footer",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=10,
            alignment=TA_CENTER,
            textColor=muted_text,
        )

        story = []

        logo_path = os.path.join(
            settings.BASE_DIR,
            "static",
            "images",
            "smartseo-logo.png",
        )
        pdf_logo = (
            ReportLabImage(logo_path, width=39 * mm, height=12.5 * mm)
            if os.path.exists(logo_path)
            else SmartSEOLogoFlowable(width=36 * mm, height=13 * mm)
        )
        # En-t?te principal
        header_identity = Table(
            [
                [
                    [
                        Paragraph("AI INSIGHTS", brand_style),
                        Paragraph(
                            report_title,
                            title_style,
                        ),
                        Paragraph(
                            report_subtitle,
                            subtitle_style,
                        ),
                    ],
                    pdf_logo,
                ],
            ],
            colWidths=[
                content_width - 48 * mm,
                48 * mm,
            ],
        )

        header_identity.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ]
            )
        )

        header_table = Table(
            [[header_identity]],
            colWidths=[
                content_width,
            ],
        )

        header_table.setStyle(
            TableStyle(
                [
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE",
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        10,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        10,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        10,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        10,
                    ),
                ]
            )
        )

        story.append(header_table)
        story.append(Spacer(1, 5 * mm))
        story.append(
            HRFlowable(
                width="100%",
                thickness=0.7,
                color=light_border,
                spaceBefore=0,
                spaceAfter=5 * mm,
            )
        )

        # Informations du rapport
        info_data = [
            [
                Paragraph("SITE ANALYSÉ", info_label_style),
                Paragraph("PÉRIODE", info_label_style),
                Paragraph("DATE DE GÉNÉRATION", info_label_style),
            ],
            [
                Paragraph(
                    escape(website_name),
                    info_value_style,
                ),
                Paragraph(
                    escape(period_label),
                    info_value_style,
                ),
                Paragraph(
                    escape(generated_at),
                    info_value_style,
                ),
            ],
        ]

        info_table = Table(
            info_data,
            colWidths=[
                content_width * 0.38,
                content_width * 0.27,
                content_width * 0.35,
            ],
        )

        info_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, -1),
                        soft_background,
                    ),
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.7,
                        light_border,
                    ),
                    (
                        "INNERGRID",
                        (0, 0),
                        (-1, -1),
                        0.4,
                        light_border,
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP",
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        10,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        10,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, 0),
                        8,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, 0),
                        2,
                    ),
                    (
                        "TOPPADDING",
                        (0, 1),
                        (-1, 1),
                        2,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 1),
                        (-1, 1),
                        9,
                    ),
                ]
            )
        )

        story.append(info_table)
        story.append(Spacer(1, 7 * mm))

        # Titre de la section analyse
        section_title_table = Table(
            [
                [
                    "",
                    Paragraph(
                        section_title,
                        section_title_style,
                    ),
                ]
            ],
            colWidths=[
                4 * mm,
                content_width - 4 * mm,
            ],
        )

        section_title_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (0, 0),
                        brand_primary,
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE",
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        0,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        0,
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                ]
            )
        )

        story.append(section_title_table)
        story.append(Spacer(1, 3 * mm))

        # Préparation du contenu Markdown
        normalized_analysis = (
            analysis
            .replace("\\n", "\n")
            .replace("\r\n", "\n")
            .replace("\r", "\n")
        )

        normalized_analysis = re.sub(
            r'periode\s+"?all"?',
            f"periode {period_label.lower()}",
            normalized_analysis,
            flags=re.IGNORECASE,
        )
        normalized_analysis = re.sub(
            r'p[eé]riode\s+"?all"?',
            f"periode {period_label.lower()}",
            normalized_analysis,
            flags=re.IGNORECASE,
        )

        def format_inline_markdown(text):
            """
            Convertit uniquement les éléments Markdown simples
            utiles dans le PDF.
            """
            safe_text = escape(text)

            safe_text = re.sub(
                r"\*\*(.+?)\*\*",
                r"<b>\1</b>",
                safe_text,
            )

            safe_text = re.sub(
                r"__(.+?)__",
                r"<b>\1</b>",
                safe_text,
            )

            safe_text = re.sub(
                r"\*(.+?)\*",
                r"<i>\1</i>",
                safe_text,
            )

            return safe_text

        lines = normalized_analysis.split("\n")

        paragraph_lines = []

        def append_paragraph():
            if not paragraph_lines:
                return

            text = " ".join(paragraph_lines).strip()

            if text:
                story.append(
                    Paragraph(
                        format_inline_markdown(text),
                        analysis_body_style,
                    )
                )

            paragraph_lines.clear()

        for raw_line in lines:
            line = raw_line.strip()

            if not line:
                append_paragraph()
                continue

            # Titres Markdown
            if line.startswith("### "):
                append_paragraph()

                story.append(
                    Paragraph(
                        format_inline_markdown(line[4:]),
                        analysis_heading_style,
                    )
                )
                continue

            if line.startswith("## "):
                append_paragraph()

                story.append(
                    Paragraph(
                        format_inline_markdown(line[3:]),
                        analysis_heading_style,
                    )
                )
                continue

            if line.startswith("# "):
                append_paragraph()

                story.append(
                    Paragraph(
                        format_inline_markdown(line[2:]),
                        analysis_heading_style,
                    )
                )
                continue

            # Ligne entièrement en gras utilisée comme titre
            if (
                line.startswith("**")
                and line.endswith("**")
                and len(line) > 4
            ):
                append_paragraph()

                story.append(
                    Paragraph(
                        format_inline_markdown(line),
                        analysis_heading_style,
                    )
                )
                continue

            # Listes à puces
            if (
                line.endswith(":")
                and len(line) <= 70
                and not line.startswith(("- ", "* "))
                and not re.match(r"^\d+[\.\)]", line)
            ):
                append_paragraph()

                story.append(
                    Paragraph(
                        format_inline_markdown(line),
                        analysis_heading_style,
                    )
                )
                continue

            if line.startswith("- ") or line.startswith("* "):
                append_paragraph()

                story.append(
                    Paragraph(
                        format_inline_markdown(line[2:]),
                        analysis_bullet_style,
                        bulletText="•",
                    )
                )
                continue

            # Listes numérotées
            numbered_match = re.match(
                r"^(\d+)[\.\)]\s+(.+)$",
                line,
            )

            if numbered_match:
                append_paragraph()

                number = numbered_match.group(1)
                item_text = numbered_match.group(2)

                story.append(
                    Paragraph(
                        format_inline_markdown(item_text),
                        analysis_bullet_style,
                        bulletText=f"{number}.",
                    )
                )
                continue

            paragraph_lines.append(line)

        append_paragraph()

        # Pied du contenu
        story.append(Spacer(1, 5 * mm))

        story.append(
            HRFlowable(
                width="100%",
                thickness=0.8,
                color=light_border,
                spaceBefore=0,
                spaceAfter=3 * mm,
            )
        )

        story.append(
            Paragraph(
                "Rapport généré automatiquement par SmartSEO. "
                "Les résultats dépendent des données GA4 et "
                "Search Console disponibles.",
                footer_style,
            )
        )

        # Numéro de page
        def add_page_number(canvas, doc):
            canvas.saveState()

            canvas.setStrokeColor(light_border)
            canvas.setLineWidth(0.5)

            canvas.line(
                left_margin,
                12 * mm,
                page_width - right_margin,
                12 * mm,
            )

            canvas.setFont("Helvetica", 7.5)
            canvas.setFillColor(muted_text)

            canvas.drawString(
                left_margin,
                8 * mm,
                "SmartSEO — Rapport SEO",
            )

            canvas.drawRightString(
                page_width - right_margin,
                8 * mm,
                f"Page {doc.page}",
            )

            canvas.restoreState()

        document.build(
            story,
            onFirstPage=add_page_number,
            onLaterPages=add_page_number,
        )

        pdf_value = buffer.getvalue()
        buffer.close()

        response = HttpResponse(
            pdf_value,
            content_type="application/pdf",
        )

        response["Content-Disposition"] = (
            'attachment; '
            f'filename="{filename}"'
        )

        return response

    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Les données JSON envoyées sont invalides."},
            status=400,
        )

    except Exception as error:
        print("Erreur export PDF :", error)

        return JsonResponse(
            {
                "error": (
                    "Impossible de générer le PDF : "
                    f"{str(error)}"
                )
            },
            status=500,
        )


@csrf_exempt
@require_POST
def export_global_analysis_pdf(request):
    return _export_ai_text_pdf(
        request,
        content_key="analysis",
        empty_message="Aucune analyse à exporter.",
        document_title="Rapport d'analyse globale SEO",
        document_subject="Analyse globale des performances SEO",
        report_title="Rapport d'analyse globale",
        report_subtitle="Synthèse des performances SEO et digitales",
        section_title="Analyse globale",
        filename="analyse-globale-seo.pdf",
    )


@csrf_exempt
@require_POST
def export_recommendations_pdf(request):
    return _export_ai_text_pdf(
        request,
        content_key="recommendations",
        empty_message="Aucune recommandation à exporter.",
        document_title="Rapport de recommandations SEO",
        document_subject="Recommandations SEO prioritaires",
        report_title="Rapport de recommandations SEO",
        report_subtitle="Actions prioritaires pour améliorer la performance SEO",
        section_title="Recommandations SEO",
        filename="recommandations-seo.pdf",
    )
@require_GET
def weekly_seo_summary(request):
    website_id = request.GET.get("website_id")

    try:
        summary = generate_weekly_seo_summary(website_id=website_id)

        return JsonResponse({
            "success": True,
            "title": summary.get("title", "Résumé hebdomadaire SEO"),
            "website_id": summary.get("website_id", website_id),
            "period": summary.get("period", "week"),
            "summary": summary.get("summary", ""),
            "kpi": summary.get("kpi", {}),
            "recommendations": summary.get("recommendations", []),
            "anomalies": summary.get("anomalies", []),
            "weak_pages": summary.get("weak_pages", []),
            "dashboard_url": "http://127.0.0.1:3000/dashboard",
            "message": "Résumé hebdomadaire généré avec succès.",
        })

    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e),
        }, status=500)
