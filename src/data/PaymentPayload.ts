import {
  ApplePayPayload,
  GooglePaymentTokenizePayload,
  HostedFieldsTokenizePayload,
  LocalPaymentTokenizePayload,
  ThreeDSecureVerifyPayload
} from "braintree-web";

export type PaymentPayload =
  | GooglePaymentTokenizePayload
  | HostedFieldsTokenizePayload
  | ThreeDSecureVerifyPayload
  | LocalPaymentTokenizePayload
  | ApplePayPayload
  | paypal.AuthorizationResponse;
