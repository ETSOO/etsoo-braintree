import {
  LocalPaymentFallback,
  LocalPaymentStartData
} from "braintree-web/modules/local-payment";
import { PaymentMethod } from "../data/PaymentMethods";

export type LocalPaymentOptions = {
  countryCode?: string;
  fallback?: LocalPaymentFallback;
  method: PaymentMethod;
  merchantAccountId?: string;
  onPaymentStart?: (data: LocalPaymentStartData) => Promise<void>;
};
