from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.dispatch import receiver

from .utils import log_event


@receiver(user_logged_in)
def on_user_logged_in(sender, request, user, **kwargs):
    log_event(
        category="auth",
        action="login",
        severity="info",
        message=f"User {user.username} logged in",
        actor=user,
        request=request,
    )


@receiver(user_logged_out)
def on_user_logged_out(sender, request, user, **kwargs):
    if user is None:
        return

    log_event(
        category="auth",
        action="logout",
        severity="info",
        message=f"User {user.username} logged out",
        actor=user,
        request=request,
    )


@receiver(user_login_failed)
def on_user_login_failed(sender, credentials, request, **kwargs):
    username = credentials.get("username") or credentials.get("email") or "unknown"
    log_event(
        category="auth",
        action="login_failed",
        severity="warning",
        message=f"Login failed for {username}",
        request=request,
        metadata={"username": username},
    )

