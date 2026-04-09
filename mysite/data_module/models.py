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
        unique_together = ("website", "date","page_path")

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
        unique_together = ("website", "date","page","query")

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