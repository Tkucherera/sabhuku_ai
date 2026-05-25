from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tutorials", "0002_tutorial_audio_status_tutorial_audio_url_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="tutorial",
            name="likes",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="tutorial",
            name="last_published_revision_hash",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
    ]
