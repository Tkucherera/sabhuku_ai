from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ApplicationLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("severity", models.CharField(choices=[("debug", "Debug"), ("info", "Info"), ("warning", "Warning"), ("error", "Error"), ("critical", "Critical")], db_index=True, max_length=16)),
                ("logger_name", models.CharField(db_index=True, max_length=255)),
                ("message", models.TextField()),
                ("traceback", models.TextField(blank=True)),
                ("module", models.CharField(blank=True, max_length=255)),
                ("function_name", models.CharField(blank=True, max_length=255)),
                ("path_name", models.TextField(blank=True)),
                ("line_number", models.PositiveIntegerField(blank=True, null=True)),
                ("process", models.IntegerField(blank=True, null=True)),
                ("thread", models.BigIntegerField(blank=True, null=True)),
                ("request_id", models.CharField(blank=True, db_index=True, max_length=64)),
                ("request_method", models.CharField(blank=True, max_length=16)),
                ("request_path", models.CharField(blank=True, db_index=True, max_length=1024)),
                ("remote_addr", models.CharField(blank=True, max_length=64)),
                ("status_code", models.PositiveIntegerField(blank=True, db_index=True, null=True)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="application_logs", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="EventLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("category", models.CharField(db_index=True, max_length=100)),
                ("action", models.CharField(db_index=True, max_length=100)),
                ("severity", models.CharField(choices=[("debug", "Debug"), ("info", "Info"), ("warning", "Warning"), ("error", "Error"), ("critical", "Critical")], db_index=True, max_length=16)),
                ("message", models.TextField(blank=True)),
                ("request_id", models.CharField(blank=True, db_index=True, max_length=64)),
                ("request_method", models.CharField(blank=True, max_length=16)),
                ("request_path", models.CharField(blank=True, db_index=True, max_length=1024)),
                ("remote_addr", models.CharField(blank=True, max_length=64)),
                ("status_code", models.PositiveIntegerField(blank=True, db_index=True, null=True)),
                ("target_model", models.CharField(blank=True, max_length=255)),
                ("target_id", models.CharField(blank=True, max_length=255)),
                ("target_repr", models.CharField(blank=True, max_length=255)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="event_logs", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]

