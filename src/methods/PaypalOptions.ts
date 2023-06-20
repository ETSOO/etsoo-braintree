export type PaypalOptions = {
  buttonStyle?: any;
  fundingSource?: "CREDIT" | "CARD" | "VENMO" | "ELV" | "PAYPAL";
  intent?: paypal.Intent;
  merchantAccountId?: string;
};
