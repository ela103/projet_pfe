from django.db import models


class Website(models.Model):
    name = models.CharField(max_length=200)
    ga4_property_id = models.CharField(max_length=50, blank=True, null=True)
    gsc_site_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "website"

    def __str__(self):
        return self.name


class GAMetrics(models.Model):
    website = models.ForeignKey(Website, on_delete=models.CASCADE)
    date = models.DateField()
    page_path = models.TextField(blank=True, null=True)
    active_users = models.IntegerField(default=0)
    sessions = models.IntegerField(default=0)
    page_views = models.IntegerField(default=0)

    engaged_sessions = models.IntegerField(default=0)
    engagement_rate = models.FloatField(default=0.0)
    average_session_duration = models.FloatField(default=0.0)
    screen_page_views_per_user = models.FloatField(default=0.0)

    class Meta:
        db_table = "ga_metrics"
        unique_together = ("website", "date", "page_path")

    def __str__(self):
        return f"{self.website.name} - {self.date}"


class GSCMetrics(models.Model):
    website = models.ForeignKey(Website, on_delete=models.CASCADE)
    date = models.DateField()
    page = models.TextField(blank=True, null=True)
    query = models.TextField(blank=True, null=True)
    clicks = models.IntegerField(default=0)
    impressions = models.IntegerField(default=0)
    ctr = models.FloatField(default=0.0)
    position = models.FloatField(default=0.0)

    class Meta:
        db_table = "gsc_metrics"
        unique_together = ("website", "date", "page", "query")

    def __str__(self):
        return f"{self.website.name} - {self.date}"


class GAEvent(models.Model):
    website = models.ForeignKey(Website, on_delete=models.CASCADE)
    date = models.DateField()
    page_path = models.TextField(blank=True, null=True)
    event_name = models.CharField(max_length=100)
    event_count = models.IntegerField(default=0)
    users = models.IntegerField(default=0)
    event_count_per_user = models.FloatField(default=0.0)
    total_revenue = models.FloatField(default=0.0)

    class Meta:
        db_table = "ga_events"
        unique_together = ("website", "date", "page_path", "event_name")

    def __str__(self):
        return f"{self.website.name} - {self.date} - {self.event_name}"


class ScrapedPage(models.Model):
    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name="scraped_pages")
    url = models.URLField(max_length=1000)

    status_code = models.IntegerField(blank=True, null=True)
    response_time_ms = models.IntegerField(blank=True, null=True)

    title = models.CharField(max_length=300, blank=True)
    title_length = models.IntegerField(default=0)

    meta_description = models.TextField(blank=True)
    meta_description_length = models.IntegerField(default=0)

    canonical = models.URLField(max_length=1000, blank=True)
    robots_meta = models.CharField(max_length=255, blank=True)

    h1_text = models.TextField(blank=True)
    h1_count = models.IntegerField(default=0)
    h2_count = models.IntegerField(default=0)

    paragraph_count = models.IntegerField(default=0)
    word_count = models.IntegerField(default=0)

    images_count = models.IntegerField(default=0)
    images_without_alt = models.IntegerField(default=0)

    internal_links_count = models.IntegerField(default=0)
    external_links_count = models.IntegerField(default=0)

    seo_score = models.IntegerField(default=0)
    issues = models.JSONField(default=list, blank=True)
    recommendations = models.JSONField(default=list, blank=True)

    raw_text_excerpt = models.TextField(blank=True)
    last_scraped_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "scraped_pages"
        unique_together = ("website", "url")

    def __str__(self):
        return f"{self.website.name} - {self.url}"
class MLScores(models.Model):
    website = models.ForeignKey(Website, on_delete=models.CASCADE)
    page_url = models.URLField(max_length=1000, blank=True, null=True)
    date = models.DateField(blank=True, null=True)

    technical_score = models.FloatField(default=0.0)
    performance_score = models.FloatField(default=0.0)
    global_score = models.FloatField(default=0.0)

    model_name = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ml_scores"

    def __str__(self):
        return f"{self.website.name} - {self.page_url} - {self.global_score}"
class Notification(models.Model):
    LEVEL_CHOICES = [
        ("info", "Info"),
        ("success", "Success"),
        ("warning", "Warning"),
        ("error", "Error"),
    ]

    title = models.CharField(max_length=255)
    message = models.TextField()
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default="info")
    source = models.CharField(max_length=100, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.level} - {self.title}"