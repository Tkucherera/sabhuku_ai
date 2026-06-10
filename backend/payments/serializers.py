from rest_framework import serializers

from .paynow_plus.paynow_express import PaymentMethod


class PaynowInitiatePaymentSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=[(method.value, method.value) for method in PaymentMethod])
    reference = serializers.CharField(max_length=128)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
    additionalinfo = serializers.CharField(required=False, allow_blank=True, default="")
    authemail = serializers.EmailField(required=False, allow_blank=True)
    authphone = serializers.CharField(required=False, allow_blank=True, max_length=32)
    authname = serializers.CharField(required=False, allow_blank=True, max_length=128)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=32)
    token = serializers.CharField(required=False, allow_blank=True, max_length=128)
    merchanttrace = serializers.CharField(required=False, allow_blank=True, max_length=32)

    def validate(self, attrs):
        method = attrs["method"]

        if method in {PaymentMethod.ECOCASH, PaymentMethod.ONEMONEY, PaymentMethod.INNBUCKS, PaymentMethod.OMARI}:
            if not attrs.get("phone"):
                raise serializers.ValidationError({"phone": "This field is required for mobile money payments."})

        if method in {PaymentMethod.VISA_MASTERCARD, PaymentMethod.ZIMSWITCH}:
            errors = {}
            if not attrs.get("token"):
                errors["token"] = "This field is required for card payments."
            if not attrs.get("merchanttrace"):
                errors["merchanttrace"] = "This field is required for card payments."
            if errors:
                raise serializers.ValidationError(errors)

        request = self.context.get("request")
        if not attrs.get("authemail") and request and request.user and request.user.is_authenticated:
            attrs["authemail"] = request.user.email
        if not attrs.get("authemail"):
            raise serializers.ValidationError({"authemail": "This field is required."})

        return attrs


class PaynowPollSerializer(serializers.Serializer):
    poll_url = serializers.URLField()


class PaynowTraceSerializer(serializers.Serializer):
    merchanttrace = serializers.CharField(max_length=32)


class PaynowOmariOtpSerializer(serializers.Serializer):
    remote_otp_url = serializers.URLField()
    otp = serializers.CharField(max_length=16)
