import os

from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode


def custom_password_reset_url_generator(request, user, temp_key):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost").rstrip("/")
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    return f"{frontend_url}/password-reset/confirm/{uid}/{temp_key}"
