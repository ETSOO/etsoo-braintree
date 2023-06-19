/**
 * Payment amount
 */
export type PaymentAmount = {
  currency: string;
  total: number;
  fractionDigits?: number;
};
