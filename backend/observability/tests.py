import logging
import sys

from django.contrib.auth import get_user_model
from django.test import RequestFactory, TestCase
from django.urls import reverse

from .handlers import DatabaseLogHandler
from .models import ApplicationLog, EventLog
from .utils import log_event


class ObservabilityTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="admin",
            password="secret123",
            is_staff=True,
            is_superuser=True,
        )
        self.factory = RequestFactory()

    def test_database_log_handler_persists_traceback(self):
        handler = DatabaseLogHandler()
        handler.setFormatter(logging.Formatter("%(message)s"))
        logger = logging.getLogger("tests.observability")

        try:
            raise RuntimeError("boom")
        except RuntimeError:
            record = logger.makeRecord(
                name=logger.name,
                level=logging.ERROR,
                fn=__file__,
                lno=25,
                msg="background task failed",
                args=(),
                exc_info=sys.exc_info(),
            )
            handler.emit(record)

        saved = ApplicationLog.objects.get()
        self.assertEqual(saved.severity, "error")
        self.assertIn("background task failed", saved.message)
        self.assertIn("RuntimeError: boom", saved.traceback)

    def test_log_event_persists_request_metadata(self):
        request = self.factory.post("/api/test/")
        request.request_id = "req-123"
        request.user = self.user

        event = log_event(
            category="dataset",
            action="created",
            actor=self.user,
            request=request,
            message="Dataset created",
            metadata={"status_code": 201},
        )

        self.assertIsNotNone(event)
        saved = EventLog.objects.get()
        self.assertEqual(saved.request_id, "req-123")
        self.assertEqual(saved.status_code, 201)
        self.assertEqual(saved.actor, self.user)

    def test_dashboard_is_available_to_admin(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse("admin:observability_dashboard"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Observability Dashboard")
