from django.contrib import admin
from .models import Website, GAMetrics, GSCMetrics ,GAEvent

admin.site.register(Website)
admin.site.register(GAMetrics)
admin.site.register(GSCMetrics)
admin.site.register(GAEvent)