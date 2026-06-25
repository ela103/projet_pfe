from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("data_module", "0013_aisitescore_aipagescore"),
    ]

    operations = [
        migrations.CreateModel(
            name="AIRecommendation",
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
                ("tool", models.CharField(default="recommendations", max_length=80)),
                ("period", models.CharField(default="all", max_length=30)),
                ("question", models.TextField(blank=True)),
                ("content", models.TextField()),
                ("source", models.CharField(blank=True, default="", max_length=80)),
                ("used_rag", models.BooleanField(default=False)),
                (
                    "retrieved_documents_count",
                    models.PositiveIntegerField(default=0),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("new", "Nouvelle"),
                            ("in_progress", "En cours"),
                            ("done", "Faite"),
                            ("ignored", "Ignoree"),
                        ],
                        default="new",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ai_recommendations",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "website",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ai_recommendations",
                        to="data_module.website",
                    ),
                ),
            ],
            options={
                "db_table": "ai_recommendations",
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(
                        fields=["website", "period", "tool"],
                        name="ai_module_a_website_89df75_idx",
                    ),
                    models.Index(
                        fields=["user", "created_at"],
                        name="ai_module_a_user_id_2a1ead_idx",
                    ),
                    models.Index(
                        fields=["status"],
                        name="ai_module_a_status_6ced5f_idx",
                    ),
                ],
            },
        ),
    ]
