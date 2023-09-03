import type {
  DataCollector,
  PayPalCheckoutCreatePaymentOptions
} from "braintree-web";

/**
 * Paypal options
 * https://braintree.github.io/braintree-web/current/module-braintree-web_paypal.html#.create
 */
export type PaypalOptions = {
  buttonStyle?: Record<string, any>;
  debug?: boolean;
  fundingSource?: string | string[];
  merchantAccountId?: string;
  vault?: boolean;
  onDataCollected?: (dataCollector: DataCollector) => void;
  paymentOptions?:
    | PayPalCheckoutCreatePaymentOptions
    | ((fundingSource: string) => PayPalCheckoutCreatePaymentOptions);

  /**
   * Funding sources to disallow from showing in the checkout buttons.
   * Do not use this query parameter to disable advanced credit and debit card payments.
   * e.g. card, credit, bancontact
   * The full list is available in the PayPal SDK docs.
   */
  "disable-funding"?: string;
  /**
   * Funding sources to allow in the checkout buttons.
   * e.g. venmo, paylater
   * The full list is available in the PayPal SDK docs.
   */
  "enable-funding"?: string;

  /**
   * The buyer country. Available in Sandbox for testing.
   */
  "buyer-country"?: string;
};
