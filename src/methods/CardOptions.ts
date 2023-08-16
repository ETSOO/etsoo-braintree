import {
  HostedFields,
  HostedFieldsField,
  HostedFieldsState
} from "braintree-web/hosted-fields";

/**
 * Card payment options
 * https://braintree.github.io/braintree-web/current/module-braintree-web_hosted-fields.html#.create
 */
export type CardOptions = {
  billingAddress?: any;
  fieldSetup?: (
    key: string,
    elment: HTMLElement,
    field: HostedFieldsField
  ) => void;
  styles?: any;
  vault?: boolean;
  setup?: (instance: HostedFields) => void;
  onSubmit?: (state: HostedFieldsState) => boolean | void;
};
