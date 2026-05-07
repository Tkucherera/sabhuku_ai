from django.contrib.auth import get_user_model
from django.utils.text import slugify
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


class SabhukuSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        if sociallogin.is_existing:
            return

        verified_email = self._get_verified_email(sociallogin)
        if not verified_email:
            return

        user = get_user_model().objects.filter(email__iexact=verified_email).first()
        if user:
            sociallogin.connect(request, user)

    def save_user(self, request, sociallogin, form=None):
        user = sociallogin.user
        if not user.email:
            provider = slugify(sociallogin.account.provider) or "social"
            uid = slugify(str(sociallogin.account.uid)) or "user"
            user.email = f"{provider}-{uid}@users.noreply.sabhuku.local"
        return super().save_user(request, sociallogin, form=form)

    def _get_verified_email(self, sociallogin):
        for email_address in sociallogin.email_addresses:
            if email_address.verified and email_address.email:
                return email_address.email
        return None
