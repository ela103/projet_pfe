from django.db import models


class Competitor(models.Model):
    domain = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    sector = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.domain


class Keyword(models.Model):
    keyword = models.CharField(max_length=255, unique=True)
    theme = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.keyword


class SerpResult(models.Model):
    keyword = models.ForeignKey(Keyword, on_delete=models.CASCADE, related_name="serp_results")
    competitor = models.ForeignKey(Competitor, on_delete=models.CASCADE, related_name="serp_results")
    url = models.URLField(max_length=1000)
    title = models.TextField(blank=True, null=True)
    snippet = models.TextField(blank=True, null=True)
    position = models.IntegerField()
    source = models.CharField(max_length=50, default="serpapi")
    collected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("keyword", "url", "position")

    def __str__(self):
        return f"{self.keyword.keyword} - {self.position} - {self.url}"


class TrafficEstimate(models.Model):
    competitor = models.ForeignKey(Competitor, on_delete=models.CASCADE, related_name="traffic_estimates")
    total_visits = models.FloatField(blank=True, null=True)
    bounce_rate = models.FloatField(blank=True, null=True)
    pages_per_visit = models.FloatField(blank=True, null=True)
    avg_visit_duration = models.FloatField(blank=True, null=True)
    source = models.CharField(max_length=50, default="similarweb")
    collected_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.competitor.domain} - {self.total_visits}"


class ScrapedCompetitorPage(models.Model):
    competitor = models.ForeignKey(Competitor, on_delete=models.CASCADE, related_name="scraped_pages")
    url = models.URLField(max_length=1000)
    title = models.TextField(blank=True, null=True)
    meta_description = models.TextField(blank=True, null=True)
    h1 = models.TextField(blank=True, null=True)
    h2 = models.TextField(blank=True, null=True)
    word_count = models.IntegerField(default=0)
    raw_text_excerpt = models.TextField(blank=True, null=True)
    scraped_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("competitor", "url")

    def __str__(self):
        return self.url