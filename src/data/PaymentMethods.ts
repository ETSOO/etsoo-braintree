/**
 * Payment methods for UI renderer
 */
export type PaymentMethods = {
  card?: React.RefCallback<HTMLElement>;
  googlePay?: React.RefCallback<HTMLElement>;
};

/**
 * Payment method names
 */
export type PaymentMethod = keyof PaymentMethods;
