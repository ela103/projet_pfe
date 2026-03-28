from django.contrib import admin
from .models import Website, GAMetrics, GSCMetrics

admin.site.register(Website)
admin.site.register(GAMetrics)
admin.site.register(GSCMetrics)
