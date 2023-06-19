import { HostedFieldsField } from "braintree-web/modules/hosted-fields";

export type CardOptions = {
  billingAddress?: any;
  fieldSetup?: (
    key: string,
    elment: HTMLInputElement,
    field: HostedFieldsField
  ) => void;
  styles?: any;
  vault?: boolean;
};
