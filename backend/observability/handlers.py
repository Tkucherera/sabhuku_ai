import logging

from django.apps import apps
from django.db import IntegrityError, OperationalError, ProgrammingError

from .context import get_request_context


def _safe_str(value):
    return "" if value is None else str(value)


class RequestContextFilter(logging.Filter):
    def filter(self, record):
        context = get_request_context()
        record.request_id = context.get("request_id", "-") or "-"
        record.request_method = context.get("request_method", "-") or "-"
        record.request_path = context.get("request_path", "-") or "-"
        record.remote_addr = context.get("remote_addr", "-") or "-"
        record.user_id = context.get("user_id") or "-"
        record.status_code = context.get("status_code") or "-"
        return True


class MaxLevelFilter(logging.Filter):
    def __init__(self, max_level):
        super().__init__()
        self.max_level = logging._nameToLevel.get(str(max_level).upper(), logging.WARNING)

    def filter(self, record):
        return record.levelno <= self.max_level


class MinLevelFilter(logging.Filter):
    def __init__(self, min_level):
        super().__init__()
        self.min_level = logging._nameToLevel.get(str(min_level).upper(), logging.ERROR)

    def filter(self, record):
        return record.levelno >= self.min_level


class DatabaseLogHandler(logging.Handler):
    def emit(self, record):
        if record.name.startswith("observability"):
            return

        if not apps.ready:
            return

        try:
            ApplicationLog = apps.get_model("observability", "ApplicationLog")
        except LookupError:
            return

        context = get_request_context()
        traceback_text = ""
        if record.exc_info:
            formatter = self.formatter or logging.Formatter()
            traceback_text = formatter.formatException(record.exc_info)
        elif record.stack_info:
            traceback_text = record.stack_info

        metadata = {
            "request_id": _safe_str(context.get("request_id", "")),
            "request_method": _safe_str(context.get("request_method", "")),
            "request_path": _safe_str(context.get("request_path", "")),
            "remote_addr": _safe_str(context.get("remote_addr", "")),
            "user_id": context.get("user_id"),
            "status_code": context.get("status_code"),
        }

        try:
            ApplicationLog.objects.create(
                severity=record.levelname.lower(),
                logger_name=_safe_str(record.name)[:255],
                message=record.getMessage(),
                traceback=traceback_text,
                module=_safe_str(getattr(record, "module", "")),
                function_name=_safe_str(getattr(record, "funcName", "")),
                path_name=_safe_str(getattr(record, "pathname", "")),
                line_number=record.lineno,
                process=record.process,
                thread=record.thread,
                request_id=metadata["request_id"],
                request_method=metadata["request_method"],
                request_path=metadata["request_path"],
                remote_addr=metadata["remote_addr"],
                status_code=metadata["status_code"],
                user_id=metadata["user_id"],
                metadata=metadata,
            )
        except (IntegrityError, OperationalError, ProgrammingError):
            return
