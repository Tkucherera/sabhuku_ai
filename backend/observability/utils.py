from django.apps import apps
from django.db import OperationalError, ProgrammingError


def _target_details(target):
    if target is None:
        return "", "", ""

    return (
        target._meta.label,
        str(target.pk),
        str(target)[:255],
    )


def log_event(
    *,
    category,
    action,
    severity="info",
    message="",
    actor=None,
    request=None,
    target=None,
    metadata=None,
):
    try:
        EventLog = apps.get_model("observability", "EventLog")
    except LookupError:
        return None

    target_model, target_id, target_repr = _target_details(target)
    metadata = dict(metadata or {})

    request_id = ""
    request_method = ""
    request_path = ""
    remote_addr = ""
    status_code = metadata.get("status_code")

    if request is not None:
        request_id = getattr(request, "request_id", "")
        request_method = request.method
        request_path = request.get_full_path()
        forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
        remote_addr = forwarded_for or request.META.get("REMOTE_ADDR", "")

    try:
        return EventLog.objects.create(
            category=category,
            action=action,
            severity=severity,
            message=message,
            actor=actor,
            request_id=request_id,
            request_method=request_method,
            request_path=request_path,
            remote_addr=remote_addr,
            status_code=status_code,
            target_model=target_model,
            target_id=target_id,
            target_repr=target_repr,
            metadata=metadata,
        )
    except (OperationalError, ProgrammingError):
        return None

