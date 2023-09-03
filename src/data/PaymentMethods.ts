/**
 * Payment methods for UI renderer
 */
export type PaymentMethods = {
  alipay?: React.RefCallback<HTMLElement>;
  applePay?: React.RefCallback<HTMLElement>;
  card?: React.RefCallback<HTMLElement>;
  googlePay?: React.RefCallback<HTMLElement>;
  paypal?: React.RefCallback<HTMLElement>;
};

/**
 * Payment method names
 */
export type PaymentMethod = keyof PaymentMethods | "paypal-paylater";
