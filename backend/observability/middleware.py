import uuid

from .context import bind_request, clear_request, update_request_context
from .utils import log_event


class RequestContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.request_id = request_id
        token = bind_request(request, request_id)

        try:
            response = self.get_response(request)
        except Exception:
            user = getattr(request, "user", None)
            if getattr(user, "is_authenticated", False):
                update_request_context(user_id=user.pk)
            update_request_context(status_code=500)
            log_event(
                category="request",
                action="exception",
                severity="error",
                message=f"{request.method} {request.get_full_path()} raised an unhandled exception",
                actor=user if getattr(user, "is_authenticated", False) else None,
                request=request,
                metadata={"request_id": request_id},
            )
            raise
        else:
            user = getattr(request, "user", None)
            if getattr(user, "is_authenticated", False):
                update_request_context(user_id=user.pk)
            update_request_context(status_code=response.status_code)

            if self._should_log_event(request, response):
                log_event(
                    category="request",
                    action="completed",
                    severity=self._severity_for_status(response.status_code),
                    message=f"{request.method} {request.get_full_path()} -> {response.status_code}",
                    actor=user if getattr(user, "is_authenticated", False) else None,
                    request=request,
                    metadata={
                        "request_id": request_id,
                        "status_code": response.status_code,
                    },
                )

            return response
        finally:
            clear_request(token)

    def _should_log_event(self, request, response):
        if request.path.startswith("/admin/observability/"):
            return False

        if response.status_code >= 400:
            return True

        return request.method in {"POST", "PUT", "PATCH", "DELETE"}

    def _severity_for_status(self, status_code):
        if status_code >= 500:
            return "error"
        if status_code >= 400:
            return "warning"
        return "info"
