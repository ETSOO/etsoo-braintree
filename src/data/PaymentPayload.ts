import {
  GooglePaymentTokenizePayload,
  HostedFieldsTokenizePayload,
  LocalPaymentTokenizePayload
} from "braintree-web";

export type PaymentPayload =
  | GooglePaymentTokenizePayload
  | HostedFieldsTokenizePayload
  | LocalPaymentTokenizePayload
  | paypal.AuthorizationResponse;
