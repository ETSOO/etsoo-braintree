import {
  ApplePayPayload,
  GooglePaymentTokenizePayload,
  HostedFieldsTokenizePayload,
  LocalPaymentTokenizePayload
} from "braintree-web";

export type PaymentPayload =
  | GooglePaymentTokenizePayload
  | HostedFieldsTokenizePayload
  | LocalPaymentTokenizePayload
  | ApplePayPayload
  | paypal.AuthorizationResponse;
