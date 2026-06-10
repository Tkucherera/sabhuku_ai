import os

from rest_framework import permissions, status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import APIView

from .paynow_plus.paynow_express import (
    PaymentMethod,
    PaynowError,
    PaynowExpress,
    parse_paynow_message,
    validate_hash,
)
from .serializers import (
    PaynowInitiatePaymentSerializer,
    PaynowOmariOtpSerializer,
    PaynowPollSerializer,
    PaynowTraceSerializer,
)


def _setting(name, default=""):
    return os.getenv(name, default)


def _paynow_client() -> PaynowExpress:
    integration_id = _setting("PAYNOW_INTEGRATION_ID")
    integration_key = _setting("PAYNOW_INTEGRATION_KEY")
    return_url = _setting("SABHUKU_PAYNOW_RETURN_URL", "http://localhost:8000/api/payments/return/")
    result_url = _setting("SABHUKU_PAYNOW_RESULT_URL", "http://localhost:8000/api/payments/result/")

    missing = [
        name
        for name, value in (
            ("PAYNOW_INTEGRATION_ID", integration_id),
            ("PAYNOW_INTEGRATION_KEY", integration_key),
        )
        if not value
    ]
    if missing:
        raise APIException(f"Paynow is not configured. Missing: {', '.join(missing)}")

    return PaynowExpress(
        integration_id=integration_id,
        integration_key=integration_key,
        return_url=return_url,
        result_url=result_url,
    )


def _response_payload(paynow_response):
    return {
        "status": paynow_response.status,
        "ok": paynow_response.ok,
        "hash_valid": paynow_response.hash_valid,
        "poll_url": paynow_response.poll_url,
        "browser_url": paynow_response.browser_url,
        "authorization_code": paynow_response.authorization_code,
        "authorization_expires": paynow_response.authorization_expires,
        "innbucks_deep_link": paynow_response.innbucks_deep_link,
        "otp_reference": paynow_response.otp_reference,
        "remote_otp_url": paynow_response.remote_otp_url,
        "fields": paynow_response.to_dict(),
    }


def _paynow_error_response(exc: PaynowError):
    return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)


class PaynowInitiatePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaynowInitiatePaymentSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        client = _paynow_client()
        method = PaymentMethod(data["method"])

        try:
            if method in {
                PaymentMethod.ECOCASH,
                PaymentMethod.ONEMONEY,
                PaymentMethod.INNBUCKS,
                PaymentMethod.OMARI,
            }:
                paynow_response = client.initiate_mobile(
                    method=method,
                    reference=data["reference"],
                    amount=data["amount"],
                    phone=data["phone"],
                    authemail=data["authemail"],
                    additionalinfo=data.get("additionalinfo", ""),
                    authphone=data.get("authphone") or None,
                    authname=data.get("authname") or None,
                    merchanttrace=data.get("merchanttrace") or None,
                )
            else:
                paynow_response = client.initiate_card(
                    method=method,
                    reference=data["reference"],
                    amount=data["amount"],
                    token=data["token"],
                    merchanttrace=data["merchanttrace"],
                    authemail=data["authemail"],
                    additionalinfo=data.get("additionalinfo", ""),
                    authphone=data.get("authphone") or None,
                    authname=data.get("authname") or None,
                )
        except PaynowError as exc:
            return _paynow_error_response(exc)

        return Response(_response_payload(paynow_response), status=status.HTTP_201_CREATED)


class PaynowPollStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaynowPollSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            paynow_response = _paynow_client().poll_status(serializer.validated_data["poll_url"])
        except PaynowError as exc:
            return _paynow_error_response(exc)

        return Response(_response_payload(paynow_response))


class PaynowTraceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaynowTraceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            paynow_response = _paynow_client().trace(serializer.validated_data["merchanttrace"])
        except PaynowError as exc:
            return _paynow_error_response(exc)

        return Response(_response_payload(paynow_response))


class PaynowOmariOtpView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaynowOmariOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            paynow_response = _paynow_client().complete_omari_otp(**serializer.validated_data)
        except PaynowError as exc:
            return _paynow_error_response(exc)

        return Response(_response_payload(paynow_response))


class PaynowResultView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        fields = parse_paynow_message(request.body.decode("utf-8"))
        hash_valid = validate_hash(fields, _setting("PAYNOW_INTEGRATION_KEY"))
        return Response(
            {
                "hash_valid": hash_valid,
                "fields": dict(fields),
            },
            status=status.HTTP_200_OK if hash_valid else status.HTTP_400_BAD_REQUEST,
        )


class PaynowReturnView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"detail": "Paynow return received.", "query": request.query_params.dict()})
