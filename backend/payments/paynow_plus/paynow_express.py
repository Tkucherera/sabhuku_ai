from __future__ import annotations

import hashlib
import hmac
from collections import OrderedDict
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from enum import StrEnum
from typing import Any, Iterable, Mapping
from urllib.parse import parse_qsl

import requests


class PaynowError(Exception):
    """Base exception for Paynow SDK errors."""


class PaynowHashError(PaynowError):
    """Raised when Paynow returns a response with an invalid hash."""


class PaynowRequestError(PaynowError):
    """Raised when a request cannot be sent or Paynow returns an error."""


class PaymentMethod(StrEnum):
    ZIMSWITCH = "zimswitch"
    VISA_MASTERCARD = "vmc"
    ECOCASH = "ecocash"
    ONEMONEY = "onemoney"
    INNBUCKS = "innbucks"
    OMARI = "omari"


class PaymentMethods:
    ZIMSWITCH = PaymentMethod.ZIMSWITCH
    VisaMasterCard = PaymentMethod.VISA_MASTERCARD
    Ecocash = PaymentMethod.ECOCASH
    OneMoney = PaymentMethod.ONEMONEY
    InnBucks = PaymentMethod.INNBUCKS
    Omari = PaymentMethod.OMARI


class PaynowTestMobileNumber(StrEnum):
    SUCCESS = "0771111111"
    DELAYED_SUCCESS = "0772222222"
    USER_CANCELLED = "0773333333"
    INSUFFICIENT_BALANCE = "0774444444"


class PaynowTestVisaMastercardToken(StrEnum):
    SUCCESS = "{11111111-1111-1111-1111-111111111111}"
    PENDING = "{22222222-2222-2222-2222-222222222222}"
    CANCELLED = "{33333333-3333-3333-3333-333333333333}"
    INSUFFICIENT_BALANCE = "{44444444-4444-4444-4444-444444444444}"


class PaynowTestZimswitchToken(StrEnum):
    SUCCESS = "11111111111111111111111111111111"
    PENDING = "22222222222222222222222222222222"
    CANCELLED = "33333333333333333333333333333333"
    INSUFFICIENT_BALANCE = "44444444444444444444444444444444"


MOBILE_MONEY_METHODS = {
    PaymentMethod.ECOCASH,
    PaymentMethod.ONEMONEY,
    PaymentMethod.INNBUCKS,
    PaymentMethod.OMARI,
}

CARD_METHODS = {
    PaymentMethod.VISA_MASTERCARD,
    PaymentMethod.ZIMSWITCH,
}


@dataclass(frozen=True)
class PaynowResponse:
    raw: str
    fields: OrderedDict[str, str]
    hash_valid: bool

    @property
    def status(self) -> str:
        return self.fields.get("status", "")

    @property
    def ok(self) -> bool:
        return self.status.lower() == "ok"

    @property
    def poll_url(self) -> str | None:
        return self.fields.get("pollurl")

    @property
    def browser_url(self) -> str | None:
        return self.fields.get("browserurl")

    @property
    def error(self) -> str | None:
        return self.fields.get("error")

    @property
    def authorization_code(self) -> str | None:
        return self.fields.get("authorizationcode")

    @property
    def authorization_expires(self) -> str | None:
        return self.fields.get("authorizationexpires")

    @property
    def innbucks_deep_link(self) -> str | None:
        if not self.authorization_code:
            return None
        return f"com.innbucks.customer://purchase?paymentToken={self.authorization_code}"

    @property
    def otp_reference(self) -> str | None:
        return self.fields.get("otpreference")

    @property
    def remote_otp_url(self) -> str | None:
        return self.fields.get("remoteotpurl")

    def to_dict(self) -> dict[str, str]:
        return dict(self.fields)


def _format_amount(amount: Decimal | float | int | str) -> str:
    decimal_amount = Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return f"{decimal_amount:.2f}"


def _coerce_method(method: PaymentMethod | str) -> PaymentMethod:
    try:
        return PaymentMethod(str(method))
    except ValueError as exc:
        supported = ", ".join(method.value for method in PaymentMethod)
        raise ValueError(f"Unsupported Paynow payment method '{method}'. Use one of: {supported}") from exc


def generate_hash(values: Mapping[str, Any] | Iterable[tuple[str, Any]], integration_key: str) -> str:
    if isinstance(values, Mapping):
        items = values.items()
    else:
        items = values

    raw_values = [
        "" if value is None else str(value)
        for key, value in items
        if key.lower() != "hash"
    ]
    payload = "".join(raw_values) + integration_key
    return hashlib.sha512(payload.encode("utf-8")).hexdigest().upper()


def parse_paynow_message(raw_message: str) -> OrderedDict[str, str]:
    pairs = parse_qsl(raw_message, keep_blank_values=True)
    return OrderedDict((key.lower(), value) for key, value in pairs)


def validate_hash(values: Mapping[str, Any] | Iterable[tuple[str, Any]], integration_key: str) -> bool:
    if isinstance(values, Mapping):
        items = list(values.items())
    else:
        items = list(values)

    received_hash = next(
        (str(value) for key, value in items if key.lower() == "hash"),
        "",
    )
    if not received_hash:
        return False

    expected_hash = generate_hash(items, integration_key)
    return hmac.compare_digest(received_hash.upper(), expected_hash)


class PaynowExpress:
    REMOTE_TRANSACTION_URL = "https://www.paynow.co.zw/interface/remotetransaction"
    TRACE_URL = "https://www.paynow.co.zw/interface/trace"

    def __init__(
        self,
        integration_id: str | int,
        integration_key: str,
        return_url: str,
        result_url: str,
        *,
        session: requests.Session | None = None,
        remote_transaction_url: str = REMOTE_TRANSACTION_URL,
        trace_url: str = TRACE_URL,
        timeout: int = 30,
        validate_response_hashes: bool = True,
    ) -> None:
        self.integration_id = str(integration_id)
        self.integration_key = integration_key
        self.return_url = return_url
        self.result_url = result_url
        self.session = session or requests.Session()
        self.remote_transaction_url = remote_transaction_url
        self.trace_url = trace_url
        self.timeout = timeout
        self.validate_response_hashes = validate_response_hashes

    def initiate_mobile(
        self,
        *,
        method: PaymentMethod | str,
        reference: str,
        amount: Decimal | float | int | str,
        phone: str,
        authemail: str,
        additionalinfo: str = "",
        authphone: str | None = None,
        authname: str | None = None,
        merchanttrace: str | None = None,
    ) -> PaynowResponse:
        payment_method = _coerce_method(method)
        if payment_method not in MOBILE_MONEY_METHODS:
            raise ValueError(f"{payment_method.value} is not a mobile money express method")

        payload = self._base_payload(
            reference=reference,
            amount=amount,
            additionalinfo=additionalinfo,
            authemail=authemail,
            authphone=authphone,
            authname=authname,
            merchanttrace=merchanttrace,
        )
        payload["method"] = payment_method.value
        payload["phone"] = phone
        return self._post_signed(self.remote_transaction_url, payload)

    def initiate_card(
        self,
        *,
        method: PaymentMethod | str,
        reference: str,
        amount: Decimal | float | int | str,
        token: str,
        merchanttrace: str,
        authemail: str,
        additionalinfo: str = "",
        authphone: str | None = None,
        authname: str | None = None,
    ) -> PaynowResponse:
        payment_method = _coerce_method(method)
        if payment_method not in CARD_METHODS:
            raise ValueError(f"{payment_method.value} is not a card express method")
        if len(merchanttrace) > 32:
            raise ValueError("merchanttrace must be 32 characters or fewer")

        payload = self._base_payload(
            reference=reference,
            amount=amount,
            additionalinfo=additionalinfo,
            authemail=authemail,
            authphone=authphone,
            authname=authname,
            merchanttrace=merchanttrace,
        )
        payload["method"] = payment_method.value
        payload["token"] = token
        return self._post_signed(self.remote_transaction_url, payload)

    def complete_omari_otp(self, *, remote_otp_url: str, otp: str) -> PaynowResponse:
        payload: OrderedDict[str, Any] = OrderedDict()
        payload["id"] = self.integration_id
        payload["otp"] = otp
        payload["status"] = "Message"
        return self._post_signed(remote_otp_url, payload)

    def poll_status(self, poll_url: str) -> PaynowResponse:
        response = self.session.post(poll_url, data={}, timeout=self.timeout)
        response.raise_for_status()
        return self._parse_response(response.text)

    def trace(self, merchanttrace: str) -> PaynowResponse:
        payload: OrderedDict[str, Any] = OrderedDict()
        payload["id"] = self.integration_id
        payload["merchanttrace"] = merchanttrace
        payload["status"] = "Message"
        return self._post_signed(self.trace_url, payload)

    def _base_payload(
        self,
        *,
        reference: str,
        amount: Decimal | float | int | str,
        additionalinfo: str,
        authemail: str,
        authphone: str | None,
        authname: str | None,
        merchanttrace: str | None,
    ) -> OrderedDict[str, Any]:
        payload: OrderedDict[str, Any] = OrderedDict()
        payload["id"] = self.integration_id
        payload["reference"] = reference
        payload["amount"] = _format_amount(amount)
        payload["additionalinfo"] = additionalinfo
        payload["returnurl"] = self.return_url
        payload["resulturl"] = self.result_url
        payload["authemail"] = authemail
        if authphone:
            payload["authphone"] = authphone
        if authname:
            payload["authname"] = authname
        if merchanttrace:
            payload["merchanttrace"] = merchanttrace
        payload["status"] = "Message"
        return payload

    def _post_signed(self, url: str, payload: OrderedDict[str, Any]) -> PaynowResponse:
        payload["hash"] = generate_hash(payload, self.integration_key)
        response = self.session.post(
            url,
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=self.timeout,
        )
        response.raise_for_status()
        parsed_response = self._parse_response(response.text)

        if parsed_response.status.lower() == "error":
            raise PaynowRequestError(parsed_response.error or response.text)
        return parsed_response

    def _parse_response(self, raw_message: str) -> PaynowResponse:
        fields = parse_paynow_message(raw_message)
        hash_valid = validate_hash(fields, self.integration_key)
        if self.validate_response_hashes and "hash" in fields and not hash_valid:
            raise PaynowHashError("Paynow response hash validation failed")
        return PaynowResponse(raw=raw_message, fields=fields, hash_valid=hash_valid)


class InnbucksExpress:
    def __init__(self, client: PaynowExpress) -> None:
        self.client = client

    def init_payment(
        self,
        *,
        reference: str,
        amount: Decimal | float | int | str,
        phone: str,
        authemail: str,
        additionalinfo: str = "",
        authname: str | None = None,
        merchanttrace: str | None = None,
    ) -> PaynowResponse:
        return self.client.initiate_mobile(
            method=PaymentMethod.INNBUCKS,
            reference=reference,
            amount=amount,
            phone=phone,
            authemail=authemail,
            additionalinfo=additionalinfo,
            authname=authname,
            merchanttrace=merchanttrace,
        )


class OmariExpress:
    def __init__(self, client: PaynowExpress) -> None:
        self.client = client

    def init_payment(
        self,
        *,
        reference: str,
        amount: Decimal | float | int | str,
        phone: str,
        authemail: str,
        additionalinfo: str = "",
        authname: str | None = None,
        merchanttrace: str | None = None,
    ) -> PaynowResponse:
        return self.client.initiate_mobile(
            method=PaymentMethod.OMARI,
            reference=reference,
            amount=amount,
            phone=phone,
            authemail=authemail,
            additionalinfo=additionalinfo,
            authname=authname,
            merchanttrace=merchanttrace,
        )

    def complete_otp(self, *, remote_otp_url: str, otp: str) -> PaynowResponse:
        return self.client.complete_omari_otp(remote_otp_url=remote_otp_url, otp=otp)
