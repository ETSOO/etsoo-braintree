/**
 * Google Pay options
 * https://braintree.github.io/braintree-web/current/module-braintree-web_google-payment.html#.create
 */
export type GooglePayOptions = {
  buttonOptions?: Omit<google.payments.api.ButtonOptions, "onClick">;
  merchantId?: string;
  totalPriceStatus?: string;
  version?: number;
};
