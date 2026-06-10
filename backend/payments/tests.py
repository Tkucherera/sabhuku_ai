from collections import OrderedDict
from unittest.mock import patch
from unittest import TestCase
from urllib.parse import urlencode

from django.contrib.auth.models import User
from django.test import TestCase as DjangoTestCase
from django.urls import reverse
from rest_framework.test import APIClient

from payments.paynow_plus.paynow_express import (
    PaymentMethod,
    PaynowExpress,
    PaynowResponse,
    PaynowTestMobileNumber,
    PaynowTestVisaMastercardToken,
    PaynowTestZimswitchToken,
    generate_hash,
    validate_hash,
)
from payments.serializers import PaynowInitiatePaymentSerializer


INTEGRATION_KEY = "3e9fed89-60e1-4ce5-ab6e-6b1eb2d4f977"


class FakeHttpResponse:
    def __init__(self, text: str) -> None:
        self.text = text

    def raise_for_status(self) -> None:
        return None


class FakeSession:
    def __init__(self, response_text: str) -> None:
        self.response_text = response_text
        self.calls = []

    def post(self, url, data=None, headers=None, timeout=None):
        self.calls.append(
            {
                "url": url,
                "data": data,
                "headers": headers,
                "timeout": timeout,
            }
        )
        return FakeHttpResponse(self.response_text)


def paynow_message(fields: OrderedDict[str, str]) -> str:
    fields["hash"] = generate_hash(fields, INTEGRATION_KEY)
    return urlencode(fields)


class PaynowExpressTests(TestCase):
    def test_test_mode_values_match_paynow_documentation(self):
        self.assertEqual(PaynowTestMobileNumber.SUCCESS, "0771111111")
        self.assertEqual(PaynowTestMobileNumber.DELAYED_SUCCESS, "0772222222")
        self.assertEqual(PaynowTestMobileNumber.USER_CANCELLED, "0773333333")
        self.assertEqual(PaynowTestMobileNumber.INSUFFICIENT_BALANCE, "0774444444")
        self.assertEqual(
            PaynowTestVisaMastercardToken.SUCCESS,
            "{11111111-1111-1111-1111-111111111111}",
        )
        self.assertEqual(
            PaynowTestZimswitchToken.SUCCESS,
            "11111111111111111111111111111111",
        )

    def test_generate_hash_matches_paynow_documentation_example(self):
        values = OrderedDict(
            [
                ("id", "1201"),
                ("reference", "TEST REF"),
                ("amount", "99.99"),
                ("additionalinfo", "A test ticket transaction"),
                ("returnurl", "http://www.google.com/search?q=returnurl"),
                ("resulturl", "http://www.google.com/search?q=resulturl"),
                ("status", "Message"),
            ]
        )

        digest = generate_hash(values, INTEGRATION_KEY)

        self.assertEqual(
            digest,
            "2A033FC38798D913D42ECB786B9B19645ADEDBDE788862032F1BD82CF3B92DEF84F316385D5B40DBB35F1A4FD7D5BFE73835174136463CDD48C9366B0749C689",
        )

    def test_validate_hash_decodes_inbound_values_before_checking(self):
        fields = OrderedDict(
            [
                ("status", "Ok"),
                ("browserurl", "https://staging.paynow.co.zw/Payment/ConfirmPayment/9510"),
                ("pollurl", "https://staging.paynow.co.zw/Interface/CheckPayment/?guid=c7ed41da-0159-46da-b428-69549f770413"),
                ("paynowreference", "9510"),
            ]
        )
        fields["hash"] = generate_hash(fields, INTEGRATION_KEY)

        self.assertTrue(validate_hash(fields, INTEGRATION_KEY))

    def test_initiate_mobile_posts_signed_form_encoded_payload(self):
        response_text = paynow_message(
            OrderedDict(
                [
                    ("status", "Ok"),
                    ("pollurl", "https://www.paynow.co.zw/Interface/CheckPayment/?guid=abc"),
                    ("authorizationcode", "INN123"),
                    ("authorizationexpires", "10-Jun-2026 12:00"),
                ]
            )
        )
        session = FakeSession(response_text)
        client = PaynowExpress(
            integration_id="1201",
            integration_key=INTEGRATION_KEY,
            return_url="https://merchant.test/return",
            result_url="https://merchant.test/result",
            session=session,
        )

        result = client.initiate_mobile(
            method=PaymentMethod.INNBUCKS,
            reference="INV-001",
            amount="10",
            phone="0771234567",
            authemail="customer@example.com",
            additionalinfo="Sabhuku credits",
        )

        call = session.calls[0]
        self.assertEqual(call["url"], PaynowExpress.REMOTE_TRANSACTION_URL)
        self.assertEqual(call["headers"]["Content-Type"], "application/x-www-form-urlencoded")
        self.assertEqual(call["data"]["amount"], "10.00")
        self.assertEqual(call["data"]["method"], "innbucks")
        self.assertEqual(call["data"]["phone"], "0771234567")
        self.assertTrue(validate_hash(call["data"], INTEGRATION_KEY))
        self.assertEqual(result.authorization_code, "INN123")
        self.assertEqual(
            result.innbucks_deep_link,
            "com.innbucks.customer://purchase?paymentToken=INN123",
        )

    def test_initiate_card_requires_merchanttrace_and_posts_token(self):
        response_text = paynow_message(
            OrderedDict(
                [
                    ("status", "Ok"),
                    ("pollurl", "https://www.paynow.co.zw/Interface/CheckPayment/?guid=card"),
                ]
            )
        )
        session = FakeSession(response_text)
        client = PaynowExpress(
            integration_id="1201",
            integration_key=INTEGRATION_KEY,
            return_url="https://merchant.test/return",
            result_url="https://merchant.test/result",
            session=session,
        )

        client.initiate_card(
            method=PaymentMethod.VISA_MASTERCARD,
            reference="INV-002",
            amount="15.50",
            token="tok_123",
            merchanttrace="trace-123",
            authemail="customer@example.com",
        )

        payload = session.calls[0]["data"]
        self.assertEqual(payload["method"], "vmc")
        self.assertEqual(payload["token"], "tok_123")
        self.assertEqual(payload["merchanttrace"], "trace-123")
        self.assertTrue(validate_hash(payload, INTEGRATION_KEY))

    def test_poll_status_posts_empty_body_to_poll_url(self):
        poll_url = "https://www.paynow.co.zw/Interface/CheckPayment/?guid=abc"
        response_text = paynow_message(
            OrderedDict(
                [
                    ("reference", "INV-001"),
                    ("paynowreference", "123456"),
                    ("amount", "10.00"),
                    ("status", "Paid"),
                    ("pollurl", poll_url),
                ]
            )
        )
        session = FakeSession(response_text)
        client = PaynowExpress("1201", INTEGRATION_KEY, "return", "result", session=session)

        response = client.poll_status(poll_url)

        self.assertEqual(session.calls[0]["url"], poll_url)
        self.assertEqual(session.calls[0]["data"], {})
        self.assertEqual(response.status, "Paid")

    def test_trace_posts_signed_merchanttrace_request(self):
        response_text = paynow_message(
            OrderedDict(
                [
                    ("status", "NotFound"),
                ]
            )
        )
        session = FakeSession(response_text)
        client = PaynowExpress("1201", INTEGRATION_KEY, "return", "result", session=session)

        response = client.trace("trace-123")

        payload = session.calls[0]["data"]
        self.assertEqual(session.calls[0]["url"], PaynowExpress.TRACE_URL)
        self.assertEqual(payload["merchanttrace"], "trace-123")
        self.assertTrue(validate_hash(payload, INTEGRATION_KEY))
        self.assertEqual(response.status, "NotFound")


class PaynowApiSerializerTests(TestCase):
    def test_mobile_money_payments_require_phone(self):
        serializer = PaynowInitiatePaymentSerializer(
            data={
                "method": "ecocash",
                "reference": "INV-001",
                "amount": "10.00",
                "authemail": "merchant@example.com",
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("phone", serializer.errors)

    def test_card_payments_require_token_and_merchanttrace(self):
        serializer = PaynowInitiatePaymentSerializer(
            data={
                "method": "vmc",
                "reference": "INV-002",
                "amount": "10.00",
                "authemail": "merchant@example.com",
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("token", serializer.errors)
        self.assertIn("merchanttrace", serializer.errors)


class FakePaynowClient:
    def __init__(self) -> None:
        self.mobile_payload = None

    def initiate_mobile(self, **kwargs):
        self.mobile_payload = kwargs
        return PaynowResponse(
            raw="status=Ok",
            fields=OrderedDict(
                [
                    ("status", "Ok"),
                    ("pollurl", "https://www.paynow.co.zw/Interface/CheckPayment/?guid=abc"),
                    ("authorizationcode", "INN123"),
                ]
            ),
            hash_valid=True,
        )


class PaynowApiViewTests(DjangoTestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="payments-user",
            email="merchant@example.com",
            password="password",
        )
        self.client.force_authenticate(self.user)

    def test_initiate_mobile_endpoint_validates_and_calls_sdk(self):
        fake_client = FakePaynowClient()

        with patch("payments.views._paynow_client", return_value=fake_client):
            response = self.client.post(
                reverse("paynow-initiate"),
                {
                    "method": "innbucks",
                    "reference": "INV-100",
                    "amount": "12.50",
                    "phone": "0771111111",
                    "additionalinfo": "Sabhuku credits",
                },
                format="json",
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(fake_client.mobile_payload["method"], PaymentMethod.INNBUCKS)
        self.assertEqual(fake_client.mobile_payload["authemail"], "merchant@example.com")
        self.assertEqual(response.data["authorization_code"], "INN123")

    @patch.dict("os.environ", {"PAYNOW_INTEGRATION_KEY": INTEGRATION_KEY})
    def test_result_endpoint_validates_paynow_hash(self):
        fields = OrderedDict(
            [
                ("reference", "INV-100"),
                ("paynowreference", "12345"),
                ("amount", "12.50"),
                ("status", "Paid"),
            ]
        )
        fields["hash"] = generate_hash(fields, INTEGRATION_KEY)

        response = self.client.post(
            reverse("paynow-result"),
            data=urlencode(fields),
            content_type="application/x-www-form-urlencoded",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["hash_valid"])
