from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers


class CustomRegisterSerializer(RegisterSerializer):
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data["first_name"] = self.validated_data.get("first_name", "")
        data["last_name"] = self.validated_data.get("last_name", "")
        return data

    def custom_signup(self, request, user):
        user.first_name = self.validated_data.get("first_name", "").strip()
        user.last_name = self.validated_data.get("last_name", "").strip()
        user.save(update_fields=["first_name", "last_name"])
