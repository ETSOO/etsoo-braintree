export type PaypalFundingResurce =
  | "CREDIT"
  | "CARD"
  | "VENMO"
  | "PAYLATER"
  | "PAYPAL";

export type PaypalOptions = {
  buttonStyle?: any;
  fundingSources?: PaypalFundingResurce[];
  intent?: "authorize" | "capture" | "sale" | "tokenize";
  locale?: string;
  merchantAccountId?: string;
};
