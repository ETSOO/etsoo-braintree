export type PaypalOptions = {
  buttonStyle?: any;
  debug?: boolean;
  intent?: "authorize" | "capture" | "sale" | "tokenize";
  merchantAccountId?: string;
  vault?: boolean;
};
