export type PaypalFundingResurce =
  | "credit"
  | "card"
  | "venmo"
  | "paylater"
  | "paypal";

export type PaypalOptions = {
  buttonStyle?: any;
  fundingSources?: PaypalFundingResurce[];
  intent?: "authorize" | "capture" | "sale" | "tokenize";
  merchantAccountId?: string;
};
