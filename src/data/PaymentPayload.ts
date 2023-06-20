import {
  GooglePaymentTokenizePayload,
  HostedFieldsTokenizePayload
} from "braintree-web";

export type PaymentPayload =
  | GooglePaymentTokenizePayload
  | HostedFieldsTokenizePayload
  | paypal.AuthorizationResponse;
