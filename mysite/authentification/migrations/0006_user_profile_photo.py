from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("authentification", "0005_passkeycredential"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="profile_photo",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to="profile_photos/%Y/%m/",
                verbose_name="Photo de profil",
            ),
        ),
    ]
