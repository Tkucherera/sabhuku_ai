from django.conf import settings
from django.db import models


class ApplicationLog(models.Model):
    SEVERITY_CHOICES = [
        ("debug", "Debug"),
        ("info", "Info"),
        ("warning", "Warning"),
        ("error", "Error"),
        ("critical", "Critical"),
    ]

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    severity = models.CharField(max_length=16, choices=SEVERITY_CHOICES, db_index=True)
    logger_name = models.CharField(max_length=255, db_index=True)
    message = models.TextField()
    traceback = models.TextField(blank=True)
    module = models.CharField(max_length=255, blank=True)
    function_name = models.CharField(max_length=255, blank=True)
    path_name = models.TextField(blank=True)
    line_number = models.PositiveIntegerField(null=True, blank=True)
    process = models.IntegerField(null=True, blank=True)
    thread = models.BigIntegerField(null=True, blank=True)
    request_id = models.CharField(max_length=64, blank=True, db_index=True)
    request_method = models.CharField(max_length=16, blank=True)
    request_path = models.CharField(max_length=1024, blank=True, db_index=True)
    remote_addr = models.CharField(max_length=64, blank=True)
    status_code = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="application_logs",
    )
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.severity.upper()} {self.logger_name}: {self.message[:80]}"


class EventLog(models.Model):
    SEVERITY_CHOICES = ApplicationLog.SEVERITY_CHOICES

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    category = models.CharField(max_length=100, db_index=True)
    action = models.CharField(max_length=100, db_index=True)
    severity = models.CharField(max_length=16, choices=SEVERITY_CHOICES, db_index=True)
    message = models.TextField(blank=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="event_logs",
    )
    request_id = models.CharField(max_length=64, blank=True, db_index=True)
    request_method = models.CharField(max_length=16, blank=True)
    request_path = models.CharField(max_length=1024, blank=True, db_index=True)
    remote_addr = models.CharField(max_length=64, blank=True)
    status_code = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    target_model = models.CharField(max_length=255, blank=True)
    target_id = models.CharField(max_length=255, blank=True)
    target_repr = models.CharField(max_length=255, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.category}.{self.action} ({self.severity})"

