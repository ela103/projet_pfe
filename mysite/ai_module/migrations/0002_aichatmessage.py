from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("ai_module", "0001_initial"),
        ("data_module", "0013_aisitescore_aipagescore"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AIChatMessage",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("question", models.TextField()),
                ("answer", models.TextField()),
                ("intent", models.CharField(blank=True, default="", max_length=80)),
                ("source", models.CharField(blank=True, default="", max_length=80)),
                ("used_rag", models.BooleanField(default=False)),
                ("retrieved_documents_count", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ai_chat_messages",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "website",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ai_chat_messages",
                        to="data_module.website",
                    ),
                ),
            ],
            options={
                "db_table": "ai_chat_messages",
                "ordering": ["created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="aichatmessage",
            index=models.Index(
                fields=["user", "created_at"],
                name="ai_module_a_user_id_0e68e8_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="aichatmessage",
            index=models.Index(
                fields=["website", "created_at"],
                name="ai_module_a_website_82e469_idx",
            ),
        ),
    ]
