import os

from allauth.account.utils import user_pk_to_url_str


def custom_password_reset_url_generator(request, user, temp_key):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    uid = user_pk_to_url_str(user)
    return f"{frontend_url}/password-reset/confirm/{uid}/{temp_key}"
