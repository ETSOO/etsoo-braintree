export type PaypalOptions = {
  buttonStyle?: any;
  fundingSource?: "CREDIT" | "CARD" | "VENMO" | "ELV" | "PAYPAL";
  intent?: "authorize" | "capture" | "sale" | "tokenize";
  merchantAccountId?: string;
};
