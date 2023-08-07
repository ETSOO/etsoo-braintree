import { DataCollector } from "braintree-web";

/**
 * Paypal options
 * https://braintree.github.io/braintree-web/current/module-braintree-web_paypal.html#.create
 */
export type PaypalOptions = {
  buttonStyle?: Record<string, any>;
  debug?: boolean;
  fundingSource?: string | string[];
  intent?: "authorize" | "capture" | "sale" | "tokenize";
  merchantAccountId?: string;
  // The Vault flow does not support Pay Later offers, https://developer.paypal.com/braintree/docs/guides/paypal/vault/javascript/v3/
  // Checkout with Vault, https://developer.paypal.com/braintree/docs/guides/paypal/checkout-with-vault/javascript/v3/
  vault?: boolean | "checkout";
  onDataCollected?: (dataCollector: DataCollector) => void;

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
