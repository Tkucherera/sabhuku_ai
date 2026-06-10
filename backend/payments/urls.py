from django.urls import path

from .views import (
    PaynowInitiatePaymentView,
    PaynowOmariOtpView,
    PaynowPollStatusView,
    PaynowResultView,
    PaynowReturnView,
    PaynowTraceView,
)


urlpatterns = [
    path("initiate/", PaynowInitiatePaymentView.as_view(), name="paynow-initiate"),
    path("poll/", PaynowPollStatusView.as_view(), name="paynow-poll"),
    path("trace/", PaynowTraceView.as_view(), name="paynow-trace"),
    path("omari/otp/", PaynowOmariOtpView.as_view(), name="paynow-omari-otp"),
    path("result/", PaynowResultView.as_view(), name="paynow-result"),
    path("return/", PaynowReturnView.as_view(), name="paynow-return"),
]
