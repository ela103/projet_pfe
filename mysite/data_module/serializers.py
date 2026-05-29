from rest_framework import serializers
from .models import Website


class WebsiteSerializer(serializers.ModelSerializer):
    added_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Website
        fields = [
            "id",
            "name",
            "ga4_property_id",
            "gsc_site_url",
            "created_at",
            "added_by",
            "added_by_name",
        ]
        read_only_fields = ["added_by", "created_at"]

    def get_added_by_name(self, obj):
        if obj.added_by:
            return obj.added_by.get_full_name() or obj.added_by.email
        return "Non renseigné"