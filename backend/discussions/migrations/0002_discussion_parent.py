import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("discussions", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="discussion",
            name="parent",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="replies",
                to="discussions.discussion",
            ),
        ),
    ]
