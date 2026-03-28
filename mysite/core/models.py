from django.db import models

class Recommendation(models.Model):
    type = models.CharField(max_length=50)  # CTR, CONTENT, TECHNICAL...
    page = models.CharField(max_length=255) # URL de la page
    action = models.TextField()             # recommandation
    priority = models.CharField(max_length=10)  # HIGH, MEDIUM, LOW
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.priority} - {self.type} - {self.page}"
