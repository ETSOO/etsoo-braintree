import {
  LocalPaymentAddress,
  LocalPaymentFallback,
  LocalPaymentStartData
} from "braintree-web/modules/local-payment";
import { PaymentMethod } from "../data/PaymentMethods";

/**
 * Local payment options
 * https://braintree.github.io/braintree-web/current/module-braintree-web_local-payment.html#.create
 */
export type LocalPaymentOptions = {
  countryCode?: string;
  fallback?: LocalPaymentFallback;
  method: PaymentMethod;
  merchantAccountId?: string;
  onLocalPaymentStart?: (data: LocalPaymentStartData) => Promise<void>;
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
