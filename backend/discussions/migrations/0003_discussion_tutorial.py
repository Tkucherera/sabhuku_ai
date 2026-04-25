import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tutorials", "0001_initial"),
        ("discussions", "0002_discussion_parent"),
    ]

    operations = [
        migrations.AddField(
            model_name="discussion",
            name="tutorial",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="tutorial_discussions",
                to="tutorials.tutorial",
            ),
        ),
    ]
