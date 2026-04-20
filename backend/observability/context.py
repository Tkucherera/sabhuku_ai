from contextvars import ContextVar


_request_context = ContextVar("observability_request_context", default={})


def _extract_remote_addr(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
    return forwarded_for or request.META.get("REMOTE_ADDR", "")


def bind_request(request, request_id):
    user = getattr(request, "user", None)
    user_id = user.pk if getattr(user, "is_authenticated", False) else None
    context = {
        "request_id": request_id,
        "request_method": request.method,
        "request_path": request.get_full_path(),
        "remote_addr": _extract_remote_addr(request),
        "user_id": user_id,
        "status_code": None,
    }
    return _request_context.set(context)


def update_request_context(**kwargs):
    current = dict(_request_context.get())
    current.update({key: value for key, value in kwargs.items() if value is not None})
    _request_context.set(current)


def get_request_context():
    return dict(_request_context.get())


def clear_request(token):
    _request_context.reset(token)

