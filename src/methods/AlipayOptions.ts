import { LocalPaymentOptions } from "./LocalPaymentOptions";

export type AlipayOptions = Omit<LocalPaymentOptions, "method"> & {};
