import {
  ApplePaySession,
  Client,
  HostedFieldFieldOptions,
  LocalPaymentTypes,
  applePay,
  client,
  googlePayment,
  hostedFields,
  localPayment,
  paypalCheckout
} from "braintree-web";
import React from "react";
import { GooglePayOptions } from "./methods/GooglePayOptions";
import { CardOptions } from "./methods/CardOptions";
import { EnvironmentType } from "./data/EnvironmentType";
import { PaymentMethod, PaymentMethods } from "./data/PaymentMethods";
import { PaymentAmount } from "./data/PaymentAmount";
import {
  HostedFieldsField,
  HostedFieldsHostedFieldsFieldName
} from "braintree-web/modules/hosted-fields";
import { HostedFieldFieldType } from "./data/HostedFieldFieldType";
import { PaymentPayload } from "./data/PaymentPayload";
import { PaypalOptions } from "./methods/PaypalOptions";
import { AlipayOptions } from "./methods/AlipayOptions";
import { LocalPaymentOptions } from "./methods/LocalPaymentOptions";
import { ApplePayOptions } from "./methods/ApplePayOptions";

/**
 * Etsoo Braintree Payment Error type
 */
export type EtsooBraintreePaymentError = (
  method: PaymentMethod,
  reason: unknown
) => void;

/**
 * Etsoo Braintree Error type
 */
export type EtsooBraintreeError = (
  method: PaymentMethod | undefined,
  reason: unknown
) => void;

/**
 * ETSOO Braintree props
 */
export type EtsooBraintreePros = {
  /**
   * Amount
   */
  amount: PaymentAmount;

  /**
   * Authorization for client creation
   */
  authorization: string;

  /**
   * Children renderer
   */
  children: (methods: PaymentMethods, amount: PaymentAmount) => React.ReactNode;

  /**
   * Environment
   */
  environment?: EnvironmentType;

  /**
   * Alipay
   */
  alipay?: AlipayOptions;

  /**
   * Apple pay
   */
  applePay?: ApplePayOptions;

  /**
   * Card payment
   */
  card?: CardOptions;

  /**
   * Google pay
   */
  googlePay?: GooglePayOptions;

  /**
   * Paypal
   */
  paypal?: PaypalOptions;

  /**
   * Error handling
   */
  onError?: EtsooBraintreeError;

  /**
   * Loading callback
   */
  onLoading?: () => React.ReactNode;

  /**
   * Payment error callback
   */
  onPaymentError?: EtsooBraintreePaymentError;

  /**
   * Payment requestable callback
   */
  onPaymentRequestable?: (payload: PaymentPayload) => void;

  /**
   * Teardown callback
   */
  onTeardown?: () => void;
};

function disableElement(element: HTMLElement, disabled: boolean = true) {
  if (disabled) element.setAttribute("disabled", "disabled");
  else element.removeAttribute("disabled");
}

async function createCard(
  clientInstance: Client,
  options: CardOptions,
  onPaymentError?: EtsooBraintreePaymentError,
  onPaymentRequestable?: (payload: PaymentPayload) => void
): Promise<React.RefCallback<HTMLElement>> {
  const { billingAddress, fieldSetup, onSubmit, setup, styles, vault } =
    options;

  return (container) => {
    if (container == null) return;

    const submit = container.querySelector<HTMLElement>(
      '[type="submit"], #submit'
    );
    if (submit == null) return;

    const fields: HostedFieldFieldOptions = {};
    const keys: HostedFieldFieldType[] = [
      "cardholderName",
      "cvv",
      "expirationDate",
      "expirationMonth",
      "expirationYear",
      "number",
      "postalCode"
    ];
    keys.forEach((key) => {
      const selector = `#${key}`;
      const keyField = container.querySelector<HTMLElement>(selector);
      if (keyField) {
        // Pass properties with container's data-*
        const ds = keyField.dataset;
        const field: HostedFieldsField = {
          selector,
          placeholder: ds.placeholder,
          type: ds.type
        };
        fields[key] = field;
        if (fieldSetup) fieldSetup(key, keyField, field);
      }
    });

    // https://braintree.github.io/braintree-web/current/module-braintree-web_hosted-fields.html#.create
    // Type for preventAutofill is unavailable
    hostedFields
      .create({
        client: clientInstance,
        styles,
        fields
      })
      .then(
        (hFields) => {
          submit.addEventListener("click", (event) => {
            event.preventDefault();

            // Check state
            const state = hFields.getState();
            const result = onSubmit == null ? undefined : onSubmit(state);
            if (result === false) return;

            if (result !== true) {
              // Default validations
              let key: HostedFieldsHostedFieldsFieldName;
              for (key in state.fields) {
                const field = state.fields[key];
                if (!field.isValid) {
                  hFields.focus(key);
                  return;
                }
              }
            }

            disableElement(submit);

            hFields.tokenize({ billingAddress, vault }, (err, payload) => {
              if (payload) {
                if (onPaymentRequestable) onPaymentRequestable(payload);
              } else if (onPaymentError) {
                onPaymentError("card", err ?? new Error("Unknown"));
              }

              disableElement(submit, false);
            });
          });
        },
        (reason) => {
          throw reason;
        }
      );

    if (setup) setup(hostedFields);
  };
}

function loadGooglePayScript() {
  if (typeof google != "undefined" && google?.payments?.api?.PaymentsClient)
    return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://pay.google.com/gp/p/js/pay.js";
    script.async = true;
    script.onerror = (err) => {
      reject(err);
    };
    script.onload = () => {
      resolve();
    };
    document.head.appendChild(script);
  });
}

async function createApplePay(
  clientInstance: Client,
  options: ApplePayOptions,
  environment: EnvironmentType,
  amount: PaymentAmount,
  onPaymentError?: EtsooBraintreePaymentError,
  onPaymentRequestable?: (payload: PaymentPayload) => void
): Promise<React.RefCallback<HTMLElement> | undefined> {
  // Destruct
  const { totalLabel = "" } = options;

  // Create apple pay
  // https://braintree.github.io/braintree-web/current/module-braintree-web_apple-pay.html#.create
  await applePay.create({ client: clientInstance });

  var paymentRequest = applePay.createPaymentRequest({
    total: {
      label: totalLabel,
      amount: amount.total.toFixed(amount.fractionDigits ?? 2)
    },

    // We recommend collecting billing address information, at minimum
    // billing postal code, and passing that billing postal code with
    // all Apple Pay transactions as a best practice.
    requiredBillingContactFields: ["postalAddress"]
  });

  console.log("Apple Pay Request", paymentRequest);

  return (button) => {
    if (button == null) return;

    button.addEventListener("click", async (event) => {
      event.preventDefault();

      disableElement(button);

      try {
        // ApplePaySession should be created each time a payment is explicitly requested by a customer,
        // such as inside an onclick event. Otherwise, it throws a JavaScript exception.
        const session = new ApplePaySession(3, paymentRequest);

        session.onvalidatemerchant = function (event) {
          applePay
            .performValidation({
              validationURL: event.validationURL,
              displayName: "My Store"
            })
            .then(function (merchantSession) {
              session.completeMerchantValidation(merchantSession);
            })
            .catch(function (validationErr) {
              // You should show an error to the user, e.g. 'Apple Pay failed to load.'
              if (onPaymentError) onPaymentError("applePay", validationErr);
              session.abort();
            });
        };

        session.onpaymentauthorized = function (event) {
          applePay
            .tokenize({
              token: event.payment.token
            })
            .then(function (payload) {
              // After you have transacted with the payload.nonce,
              // call 'completePayment' to dismiss the Apple Pay sheet.
              if (onPaymentRequestable) onPaymentRequestable(payload);
              session.completePayment(ApplePaySession.STATUS_SUCCESS);
            })
            .catch(function (tokenizeErr) {
              if (onPaymentError) onPaymentError("applePay", tokenizeErr);
              session.completePayment(ApplePaySession.STATUS_FAILURE);
            });
        };

        session.begin();
      } catch (ex) {
        if (onPaymentError) onPaymentError("applePay", ex);
      }

      disableElement(button, false);
    });
  };
}

async function createGooglePay(
  clientInstance: Client,
  options: GooglePayOptions,
  environment: EnvironmentType,
  amount: PaymentAmount,
  onPaymentError?: EtsooBraintreePaymentError,
  onPaymentRequestable?: (payload: PaymentPayload) => void
): Promise<React.RefCallback<HTMLElement> | undefined> {
  // Load google payment script
  await loadGooglePayScript();

  const { merchantId, totalPriceStatus = "FINAL", version = 2 } = options;

  // Google payment instance
  // https://braintree.github.io/braintree-web/current/module-braintree-web_google-payment.html#.create
  const paymentInstance = await googlePayment.create({
    client: clientInstance,
    googlePayVersion: version,
    googleMerchantId: merchantId
  });

  // Google payment client
  const paymentClient = new google.payments.api.PaymentsClient({
    environment
  });

  // Google payment request
  const request = await paymentInstance.createPaymentDataRequest({
    transactionInfo: {
      currencyCode: amount.currency,
      totalPriceStatus,
      totalPrice: amount.total.toFixed(amount.fractionDigits ?? 2)
    }
  });

  // Google payment isReadyToPay response
  const response = await paymentClient.isReadyToPay({
    apiVersion: version,
    apiVersionMinor: 0,
    allowedPaymentMethods: request.allowedPaymentMethods,
    existingPaymentMethodRequired: true
  });
  if (response.result) {
    return (button) => {
      if (button == null) return;

      button.addEventListener("click", async (event) => {
        event.preventDefault();

        disableElement(button);

        try {
          // Load payment data
          const paymentData = await paymentClient.loadPaymentData(request);

          // Parse payment data response
          const paymentResponse = await paymentInstance.parseResponse(
            paymentData
          );

          if (onPaymentRequestable) onPaymentRequestable(paymentResponse);
        } catch (ex) {
          if (onPaymentError) onPaymentError("googlePay", ex);
        }

        disableElement(button, false);
      });
    };
  }
}

async function createPaypal(
  clientInstance: Client,
  options: PaypalOptions,
  environment: EnvironmentType,
  amount: PaymentAmount,
  onPaymentError?: EtsooBraintreePaymentError,
  onPaymentRequestable?: (payload: PaymentPayload) => void
): Promise<React.RefCallback<HTMLElement>> {
  const {
    buttonStyle,
    debug = false,
    merchantAccountId,
    intent = "capture",
    vault = false
  } = options;

  // https://braintree.github.io/braintree-web/current/module-braintree-web_paypal.html#.create
  const payInstance = await paypalCheckout.create({
    client: clientInstance,
    merchantAccountId
  });

  // Enable or disable funding resources within the portal site
  // Not in configuration
  await payInstance.loadPayPalSDK({
    currency: amount.currency,
    intent,
    debug,
    vault
  });

  const paypal = globalThis.paypal;

  return (container) => {
    if (container == null) return;

    if (container.id === "") container.id = "paypal-container";

    try {
      const flow = vault ? "vault" : "checkout";
      paypal
        .Buttons({
          style: buttonStyle,
          fundingSource: "paypal",
          createOrder() {
            return payInstance.createPayment({
              flow: flow as paypal.FlowType, // Required
              amount: amount.total, // Required
              currency: amount.currency, // Required, must match the currency passed in with loadPayPalSDK

              intent: intent as paypal.Intent, // Must match the intent passed in with loadPayPalSDK

              enableShippingAddress: true,
              shippingAddressEditable: true
            });
          },
          onApprove(data, actions) {
            return payInstance.tokenizePayment(data).then(
              (payload) => {
                if (onPaymentRequestable) onPaymentRequestable(payload);
                return payload;
              },
              (reason) => {
                if (onPaymentError) onPaymentError("paypal", reason);
                return {} as paypal.AuthorizationResponse;
              }
            );
          },
          onCancel(data) {
            console.log("PayPal payment cancelled", data);
          },
          onError(err) {
            if (onPaymentError) onPaymentError("paypal", err);
          }
        })
        .render(`#${container.id}`);
    } catch (ex) {
      if (onPaymentError) onPaymentError("paypal", ex);
    }
  };
}

async function createLocalPayment(
  clientInstance: Client,
  options: LocalPaymentOptions,
  environment: EnvironmentType,
  amount: PaymentAmount,
  onPaymentError?: EtsooBraintreePaymentError,
  onPaymentRequestable?: (payload: PaymentPayload) => void
): Promise<React.RefCallback<HTMLElement>> {
  const {
    countryCode,
    fallback,
    merchantAccountId,
    method,
    onPaymentStart,
    personalData
  } = options;

  // https://braintree.github.io/braintree-web/current/module-braintree-web_local-payment.html#.create
  const localPaymentInstance = await localPayment.create({
    client: clientInstance,
    merchantAccountId
  });

  return (button) => {
    if (button == null) return;

    button.addEventListener("click", async (event) => {
      event.preventDefault();
      disableElement(button);

      try {
        const payload = await localPaymentInstance.startPayment({
          paymentType: method as LocalPaymentTypes,
          amount: amount.total,
          fallback,
          currencyCode: amount.currency,
          address: {
            countryCode
          },
          onPaymentStart: function (data, start) {
            // NOTE: It is critical here to store data.paymentId on your server
            //       so it can be mapped to a webhook sent by Braintree once the
            //       buyer completes their payment. See Start the payment
            //       section for details.
            if (onPaymentStart) {
              onPaymentStart(data).then(
                () => start(),
                (reason) => {
                  if (onPaymentError) onPaymentError(method, reason);
                }
              );
            } else {
              // Call start to initiate the popup
              start();
            }
          },
          ...personalData
        });

        if (onPaymentRequestable) onPaymentRequestable(payload);
      } catch (ex) {
        if (onPaymentError) onPaymentError(method, ex);
      }

      disableElement(button, false);
    });
  };
}

/**
 * Etsoo Braintree UI component
 * https://braintree.github.io/braintree-web/current/index.html
 * @param props Props
 * @returns Component
 */
export function EtsooBraintree(props: EtsooBraintreePros) {
  // Destruct
  const {
    amount,
    authorization,
    children,
    environment = "TEST",

    alipay,
    applePay,
    card,
    googlePay,
    paypal,

    onError = (reason) => console.log(reason),
    onLoading = () => "...",
    onPaymentError,
    onPaymentRequestable,
    onTeardown = () => console.log("Teardown")
  } = props;

  // States
  const [methods, setMethods] = React.useState<PaymentMethods>();
  const isMounted = React.useRef<boolean>();

  React.useEffect(() => {
    // Every renderere
    setMethods(undefined);

    client.create({ authorization }).then(
      async (clientInstance) => {
        // Payment methods
        const items: PaymentMethods = {};

        if (alipay) {
          try {
            const alipayRef = await createLocalPayment(
              clientInstance,
              { ...alipay, method: "alipay" },
              environment,
              amount,
              onPaymentError,
              onPaymentRequestable
            );
            items.alipay = alipayRef;
          } catch (error) {
            onError("alipay", error);
          }
        }

        if (applePay) {
          try {
            if ((globalThis as any).ApplePaySession) {
              console.log("This device does not support Apple Pay");
            } else if (!ApplePaySession.canMakePayments()) {
              console.log(
                "This device is not capable of making Apple Pay payments"
              );
            } else {
              const applePayRef = await createApplePay(
                clientInstance,
                applePay,
                environment,
                amount,
                onPaymentError,
                onPaymentRequestable
              );
              items.applePay = applePayRef;
            }
          } catch (error) {
            onError("applePay", error);
          }
        }

        if (card) {
          try {
            const cardRef = await createCard(
              clientInstance,
              card,
              onPaymentError,
              onPaymentRequestable
            );
            items.card = cardRef;
          } catch (error) {
            onError("card", error);
          }
        }

        if (googlePay) {
          try {
            const googlePayRef = await createGooglePay(
              clientInstance,
              googlePay,
              environment,
              amount,
              onPaymentError,
              onPaymentRequestable
            );

            if (googlePayRef == null) {
              onError(
                "googlePay",
                new Error("GooglePay API isReadyToPay failed")
              );
            } else {
              items.googlePay = googlePayRef;
            }
          } catch (error) {
            onError("googlePay", error);
          }
        }

        if (paypal) {
          try {
            const paypalRef = await createPaypal(
              clientInstance,
              paypal,
              environment,
              amount,
              onPaymentError,
              onPaymentRequestable
            );
            items.paypal = paypalRef;
          } catch (error) {
            onError("paypal", error);
          }
        }

        // Update methods
        setMethods(items);
      },
      (reason) => {
        onError(undefined, reason);
      }
    );

    return () => {
      isMounted.current = false;
      if (client.teardown) client.teardown(onTeardown);
    };
  }, [authorization]);

  const childrenUI = React.useMemo(
    () => (methods == null ? onLoading() : children(methods, amount)),
    [methods, amount, onLoading]
  );

  return <React.Fragment>{childrenUI}</React.Fragment>;
}
