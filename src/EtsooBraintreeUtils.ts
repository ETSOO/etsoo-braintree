import { HostedFieldsTokenizePayload } from "braintree-web";
import { PaymentPayload } from "./data/PaymentPayload";

/**
 * Etsoo Braintree utilities
 */
export namespace EtsooBraintreeUtils {
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
