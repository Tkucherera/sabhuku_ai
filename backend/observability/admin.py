from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group, User
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils import timezone
try:
    from unfold.admin import ModelAdmin
    from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm
except ImportError:  # pragma: no cover
    from django.contrib.admin import ModelAdmin
    AdminPasswordChangeForm = BaseUserAdmin.change_password_form
    UserChangeForm = BaseUserAdmin.form
    UserCreationForm = BaseUserAdmin.add_form

from .models import ApplicationLog, EventLog


def observability_dashboard_view(request):
    now = timezone.now()
    last_24h = now - timezone.timedelta(hours=24)
    last_7d = now - timezone.timedelta(days=7)

    log_window = ApplicationLog.objects.filter(created_at__gte=last_7d)
    event_window = EventLog.objects.filter(created_at__gte=last_7d)

    context = {
        **admin.site.each_context(request),
        "title": "Observability Dashboard",
        "opts": ApplicationLog._meta,
        "summary": {
            "logs_last_24h": ApplicationLog.objects.filter(created_at__gte=last_24h).count(),
            "errors_last_24h": ApplicationLog.objects.filter(
                created_at__gte=last_24h,
                severity__in=["error", "critical"],
            ).count(),
            "events_last_24h": EventLog.objects.filter(created_at__gte=last_24h).count(),
            "events_last_7d": event_window.count(),
        },
        "top_loggers": log_window.values("logger_name").annotate(total=Count("id")).order_by("-total")[:8],
        "log_levels": log_window.values("severity").annotate(total=Count("id")).order_by("-total"),
        "event_categories": event_window.values("category").annotate(total=Count("id")).order_by("-total")[:8],
        "event_actions": event_window.values("action").annotate(total=Count("id")).order_by("-total")[:8],
        "log_trend": list(
            log_window.annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(total=Count("id"))
            .order_by("day")
        ),
        "recent_errors": ApplicationLog.objects.filter(severity__in=["error", "critical"])[:15],
        "recent_events": EventLog.objects.select_related("actor")[:15],
        "application_log_changelist_url": reverse("admin:observability_applicationlog_changelist"),
        "event_log_changelist_url": reverse("admin:observability_eventlog_changelist"),
    }
    return TemplateResponse(request, "admin/observability/dashboard.html", context)


def _admin_get_urls(get_urls):
    def wrapped():
        custom_urls = [
            path(
                "observability/dashboard/",
                admin.site.admin_view(observability_dashboard_view),
                name="observability_dashboard",
            )
        ]
        return custom_urls + get_urls()

    return wrapped


if not getattr(admin.site, "_observability_urls_registered", False):
    admin.site.get_urls = _admin_get_urls(admin.site.get_urls)
    admin.site._observability_urls_registered = True


try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass

try:
    admin.site.unregister(Group)
except admin.sites.NotRegistered:
    pass


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm
    list_display = ("username", "email", "first_name", "last_name", "is_staff", "is_active")


@admin.register(Group)
class GroupAdmin(BaseGroupAdmin, ModelAdmin):
    pass


class ReadOnlyAdmin(ModelAdmin):
    actions = None
    change_list_template = "admin/observability/change_list.html"

    def has_view_permission(self, request, obj=None):
        return request.user.is_active and request.user.is_staff

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(ApplicationLog)
class ApplicationLogAdmin(ReadOnlyAdmin):
    list_display = (
        "created_at",
        "severity",
        "logger_name",
        "request_method",
        "request_path",
        "status_code",
        "user",
        "short_message",
    )
    list_filter = ("severity", "logger_name", "request_method", "status_code", "created_at")
    search_fields = ("message", "traceback", "request_path", "request_id", "logger_name")
    readonly_fields = (
        "created_at",
        "severity",
        "logger_name",
        "message",
        "traceback",
        "module",
        "function_name",
        "path_name",
        "line_number",
        "process",
        "thread",
        "request_id",
        "request_method",
        "request_path",
        "remote_addr",
        "status_code",
        "user",
        "metadata",
    )

    def short_message(self, obj):
        return obj.message[:120]

    short_message.short_description = "Message"


@admin.register(EventLog)
class EventLogAdmin(ReadOnlyAdmin):
    list_display = (
        "created_at",
        "category",
        "action",
        "severity",
        "actor",
        "request_method",
        "request_path",
        "status_code",
        "target_repr",
    )
    list_filter = ("category", "action", "severity", "request_method", "status_code", "created_at")
    search_fields = ("message", "request_path", "request_id", "target_repr", "target_model")
    readonly_fields = (
        "created_at",
        "category",
        "action",
        "severity",
        "message",
        "actor",
        "request_id",
        "request_method",
        "request_path",
        "remote_addr",
        "status_code",
        "target_model",
        "target_id",
        "target_repr",
        "metadata",
    )
