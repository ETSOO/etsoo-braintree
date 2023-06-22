import {
  LocalPaymentAddress,
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
  personalData?: {
    givenName?: string;
    surname?: string;
    email?: string;
    phone?: string;
    bic?: string;
    shippingAddressRequired?: boolean;
    address?: LocalPaymentAddress;
  };
  windowOptions?: {
    width?: number | undefined;
    height?: number | undefined;
  };
};
