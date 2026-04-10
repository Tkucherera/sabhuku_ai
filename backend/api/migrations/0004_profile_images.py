from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_sync_upload_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="avatar_url",
            field=models.URLField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="cover_image_url",
            field=models.URLField(blank=True, default=""),
        ),
    ]
