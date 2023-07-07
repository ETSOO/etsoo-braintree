import {
  ApplePayPayload,
  GooglePaymentTokenizePayload,
  HostedFieldsTokenizePayload,
  ThreeDSecureVerifyPayload
} from "braintree-web";
import { PaymentPayload } from "./data/PaymentPayload";

/**
 * Etsoo Braintree utilities
 */
export namespace EtsooBraintreeUtils {
  /**
   * Is Apple Pay response payload or not
   * @param payload Response payload
   * @returns Result
   */
  export function isApplePayResponse(
    payload: PaymentPayload
  ): payload is ApplePayPayload {
    return payload.type === "ApplePayCard";
  }

  /**
   * Is card payment response payload or not
   * @param payload Response payload
   * @returns Result
   */
  export function isCardResponse(
    payload: PaymentPayload
  ): payload is HostedFieldsTokenizePayload {
    return payload.type === "CreditCard";
  }

  /**
   * Is card payment 3DS response payload or not
   * @param payload Response payload
   * @returns Result
   */
  export function isCard3DSResponse(
    payload: PaymentPayload
  ): payload is ThreeDSecureVerifyPayload {
    return payload.type === "CreditCard" && "threeDSecureInfo" in payload;
  }

  /**
   * Is Google Pay response payload or not
   * @param payload Response payload
   * @returns Result
   */
  export function isGooglePayResponse(
    payload: PaymentPayload
  ): payload is GooglePaymentTokenizePayload {
    const type = payload.type;
    return (
      type === "AndroidPayCard" ||
      (type === "CreditCard" && "binData" in payload)
    );
  }

  /**
   * Is Paypal response payload or not
   * @param payload Response payload
   * @returns Result
   */
  export function isPaypalResponse(
    payload: PaymentPayload
  ): payload is paypal.AuthorizationResponse {
    return payload.type === "PayPalAccount";
  }
}
