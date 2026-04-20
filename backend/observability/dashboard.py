from django.contrib.auth import get_user_model

from api.models import Dataset, Model
from .models import ApplicationLog, EventLog


def admin_dashboard_callback(request, context):
    context.update(
        {
            "dashboard_cards": [
                {
                    "label": "Users",
                    "value": get_user_model().objects.count(),
                    "detail": "People using Sabhuku AI",
                },
                {
                    "label": "Models",
                    "value": Model.objects.count(),
                    "detail": "Published model entries",
                },
                {
                    "label": "Datasets",
                    "value": Dataset.objects.count(),
                    "detail": "Datasets available in the catalog",
                },
                {
                    "label": "Errors",
                    "value": ApplicationLog.objects.filter(severity__in=["error", "critical"]).count(),
                    "detail": "Captured backend exceptions",
                },
            ],
            "dashboard_recent_logs": ApplicationLog.objects.select_related("user")[:6],
            "dashboard_recent_events": EventLog.objects.select_related("actor")[:6],
        }
    )
    return context
