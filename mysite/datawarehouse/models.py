
from django.db import models


class DimWebsite(models.Model):
    """
    Dimension représentant les sites provenant
    de la table opérationnelle Website.
    """

    source_website_id = models.PositiveBigIntegerField(
        unique=True,
        help_text="Identifiant du site dans la table opérationnelle Website",
    )

    name = models.CharField(max_length=200)

    ga4_property_id = models.CharField(
        max_length=50,
        blank=True,
        default="",
    )

    gsc_site_url = models.URLField(
        max_length=1000,
        blank=True,
        default="",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "dw_dim_website"
        ordering = ["name"]
        verbose_name = "Dimension site"
        verbose_name_plural = "Dimensions sites"

    def __str__(self):
        return self.name


class DimDate(models.Model):
    """
    Dimension temporelle commune aux différentes tables de faits.
    """

    full_date = models.DateField(unique=True)

    day = models.PositiveSmallIntegerField()
    month = models.PositiveSmallIntegerField()
    year = models.PositiveSmallIntegerField()
    quarter = models.PositiveSmallIntegerField()

    day_of_week = models.PositiveSmallIntegerField()
    day_name = models.CharField(max_length=20)
    month_name = models.CharField(max_length=20)

    class Meta:
        db_table = "dw_dim_date"
        ordering = ["full_date"]
        verbose_name = "Dimension date"
        verbose_name_plural = "Dimensions dates"

    def __str__(self):
        return str(self.full_date)


class DimPage(models.Model):
    """
    Dimension représentant une page appartenant à un site.
    """

    website = models.ForeignKey(
        DimWebsite,
        on_delete=models.CASCADE,
        related_name="pages",
    )

    page_path = models.TextField()

    full_url = models.URLField(
        max_length=1000,
        blank=True,
        default="",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "dw_dim_page"
        ordering = ["website", "page_path"]
        verbose_name = "Dimension page"
        verbose_name_plural = "Dimensions pages"

        constraints = [
            models.UniqueConstraint(
                fields=["website", "page_path"],
                name="dw_unique_page_per_website",
            )
        ]

    def __str__(self):
        return f"{self.website.name} - {self.page_path}"


class FactGAMetrics(models.Model):
    """
    Table de faits contenant les métriques générales
    provenant de Google Analytics 4.
    """

    website = models.ForeignKey(
        DimWebsite,
        on_delete=models.PROTECT,
        related_name="ga_metrics_facts",
    )

    date = models.ForeignKey(
        DimDate,
        on_delete=models.PROTECT,
        related_name="ga_metrics_facts",
    )

    page = models.ForeignKey(
        DimPage,
        on_delete=models.PROTECT,
        related_name="ga_metrics_facts",
        null=True,
        blank=True,
    )

    active_users = models.IntegerField(default=0)
    sessions = models.IntegerField(default=0)
    page_views = models.IntegerField(default=0)

    engaged_sessions = models.IntegerField(default=0)
    engagement_rate = models.FloatField(default=0.0)
    average_session_duration = models.FloatField(default=0.0)
    screen_page_views_per_user = models.FloatField(default=0.0)

    class Meta:
        db_table = "dw_fact_ga_metrics"
        ordering = ["date_id"]
        verbose_name = "Fait métriques GA4"
        verbose_name_plural = "Faits métriques GA4"

        constraints = [
            models.UniqueConstraint(
                fields=["website", "date", "page"],
                name="dw_unique_ga_metrics_grain",
            )
        ]

    def __str__(self):
        page_value = self.page.page_path if self.page else "Toutes les pages"
        return (
            f"{self.website.name} - "
            f"{self.date.full_date} - "
            f"{page_value}"
        )


class FactGSCMetrics(models.Model):
    """
    Table de faits contenant les performances
    provenant de Google Search Console.
    """

    website = models.ForeignKey(
        DimWebsite,
        on_delete=models.PROTECT,
        related_name="gsc_metrics_facts",
    )

    date = models.ForeignKey(
        DimDate,
        on_delete=models.PROTECT,
        related_name="gsc_metrics_facts",
    )

    page = models.ForeignKey(
        DimPage,
        on_delete=models.PROTECT,
        related_name="gsc_metrics_facts",
        null=True,
        blank=True,
    )

    query = models.TextField(
        blank=True,
        default="",
    )

    clicks = models.IntegerField(default=0)
    impressions = models.IntegerField(default=0)
    ctr = models.FloatField(default=0.0)
    position = models.FloatField(default=0.0)

    class Meta:
        db_table = "dw_fact_gsc_metrics"
        ordering = ["date_id"]
        verbose_name = "Fait métriques GSC"
        verbose_name_plural = "Faits métriques GSC"

        constraints = [
            models.UniqueConstraint(
                fields=["website", "date", "page", "query"],
                name="dw_unique_gsc_metrics_grain",
            )
        ]

    def __str__(self):
        page_value = self.page.page_path if self.page else "Toutes les pages"
        query_value = self.query or "Toutes les requêtes"

        return (
            f"{self.website.name} - "
            f"{self.date.full_date} - "
            f"{page_value} - "
            f"{query_value}"
        )


class FactGAEvent(models.Model):
    """
    Table de faits contenant les événements
    provenant de Google Analytics 4.
    """

    website = models.ForeignKey(
        DimWebsite,
        on_delete=models.PROTECT,
        related_name="ga_event_facts",
    )

    date = models.ForeignKey(
        DimDate,
        on_delete=models.PROTECT,
        related_name="ga_event_facts",
    )

    page = models.ForeignKey(
        DimPage,
        on_delete=models.PROTECT,
        related_name="ga_event_facts",
        null=True,
        blank=True,
    )

    event_name = models.CharField(max_length=100)

    event_count = models.IntegerField(default=0)
    users = models.IntegerField(default=0)
    event_count_per_user = models.FloatField(default=0.0)
    total_revenue = models.FloatField(default=0.0)

    class Meta:
        db_table = "dw_fact_ga_events"
        ordering = ["date_id", "event_name"]
        verbose_name = "Fait événement GA4"
        verbose_name_plural = "Faits événements GA4"

        constraints = [
            models.UniqueConstraint(
                fields=["website", "date", "page", "event_name"],
                name="dw_unique_ga_event_grain",
            )
        ]

    def __str__(self):
        page_value = self.page.page_path if self.page else "Toutes les pages"

        return (
            f"{self.website.name} - "
            f"{self.date.full_date} - "
            f"{page_value} - "
            f"{self.event_name}"
        )

