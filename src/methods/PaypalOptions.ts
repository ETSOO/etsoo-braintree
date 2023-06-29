/**
 * Paypal options
 * https://braintree.github.io/braintree-web/current/module-braintree-web_paypal.html#.create
 */
export type PaypalOptions = {
  buttonStyle?: any;
  debug?: boolean;
  intent?: "authorize" | "capture" | "sale" | "tokenize";
  merchantAccountId?: string;
  vault?: boolean;
};
