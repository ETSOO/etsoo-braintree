import {
  ApplePaySession,
  Client,
  HostedFieldFieldOptions,
  LocalPaymentTypes,
  ThreeDSecure,
  applePay,
  client,
  googlePayment,
  hostedFields,
  localPayment,
  paypalCheckout,
  threeDSecure
} from "braintree-web";
import React from "react";
import { GooglePayOptions } from "./methods/GooglePayOptions";
import { CardOptions } from "./methods/CardOptions";
import { EnvironmentType } from "./data/EnvironmentType";
import { PaymentMethod, PaymentMethods } from "./data/PaymentMethods";
import { PaymentAmount } from "./data/PaymentAmount";
import {
  HostedFields,
  HostedFieldsField,
  HostedFieldsHostedFieldsFieldName
} from "braintree-web/modules/hosted-fields";
import { HostedFieldFieldType } from "./data/HostedFieldFieldType";
import { PaymentPayload } from "./data/PaymentPayload";
import { PaypalOptions } from "./methods/PaypalOptions";
import { AlipayOptions } from "./methods/AlipayOptions";
import { LocalPaymentOptions } from "./methods/LocalPaymentOptions";
import { ApplePayOptions } from "./methods/ApplePayOptions";
import { ThreeDSecureVerificationData } from "braintree-web/modules/three-d-secure";

/**
 * Etsoo Braintree Payment Error type
 */
export type EtsooBraintreePaymentError = (
  method: PaymentMethod,
  reason: unknown
) => void;

type PaymentErrorHandler = (
  element: HTMLElement,
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
 * Error with custom data
 * Copy from 'DataError' of @etsoo/shared
 * Other information can be hold by 'name', 'cause', and 'stack' property
 *
 */
export class EtsooBraintreeDataError<
  T = Record<string, unknown>
> extends Error {
  /**
   * Custom data
   */
  public readonly data: T;

  /**
   * Constructor
   * @param message Error message
   * @param data Custom data
   */
  constructor(message: string, data: T) {
    super(message);

    this.data = data;

    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, EtsooBraintreeDataError.prototype);
  }
}

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
   * 3D Secure required or not
   */
  threeDSecure?: boolean;

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
  onPaymentRequestable: (payload: PaymentPayload) => Promise<void>;

  /**
   * Payment start callback
   */
  onPaymentStart?: (event: MouseEvent, element: HTMLElement) => boolean | void;

  /**
   * Payment end callback
   */
  onPaymentEnd?: (element: HTMLElement) => void;

  /**
   * Teardown callback
   */
  onTeardown?: () => void;
};

async function createCard(
  clientInstance: Client,
  options: CardOptions,
  amount: PaymentAmount,
  hostedFieldsRef: React.MutableRefObject<HostedFields | undefined>,
  onPaymentRequestable: (
    button: HTMLElement,
    payload: PaymentPayload
  ) => Promise<void>,
  onPaymentError: PaymentErrorHandler,
  threeDSecureInstance?: ThreeDSecure,
  onPaymentStart?: (event: MouseEvent, element: HTMLElement) => boolean | void
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
          // Reference
          hostedFieldsRef.current = hFields;

          // Additional setup actions
          if (setup) setup(hFields);

          // Click handler
          submit.addEventListener("click", (event) => {
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

            if (onPaymentStart && onPaymentStart(event, submit) === false)
              return;

            hFields.tokenize({ billingAddress, vault }, (err, payload) => {
              if (payload) {
                if (threeDSecureInstance) {
                  threeDSecureInstance
                    .verifyCard({
                      amount: amount.total,
                      nonce: payload.nonce,
                      bin: payload.details.bin,

                      billingAddress
                    })
                    .then(
                      (payload) => {
                        onPaymentRequestable(submit, payload);
                      },
                      (reason) => {
                        onPaymentError(submit, "card", reason);
                      }
                    );
                } else {
                  onPaymentRequestable(submit, payload);
                }
              } else {
                onPaymentError(submit, "card", err ?? new Error("Unknown"));
              }
            });
          });
        },
        (reason) => {
          throw reason;
        }
      );
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
  onPaymentRequestable: (
    button: HTMLElement,
    payload: PaymentPayload
  ) => Promise<void>,
  onPaymentError: PaymentErrorHandler,
  onPaymentStart?: (event: MouseEvent, element: HTMLElement) => boolean | void
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

  return (button) => {
    if (button == null) return;

    button.addEventListener("click", async (event) => {
      if (onPaymentStart && onPaymentStart(event, button) === false) return;

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
              onPaymentError(button, "applePay", validationErr);
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
              onPaymentRequestable(button, payload);
              session.completePayment(ApplePaySession.STATUS_SUCCESS);
            })
            .catch(function (tokenizeErr) {
              onPaymentError(button, "applePay", tokenizeErr);
              session.completePayment(ApplePaySession.STATUS_FAILURE);
            });
        };

        session.begin();
      } catch (ex) {
        onPaymentError(button, "applePay", ex);
      }
    });
  };
}

async function createGooglePay(
  clientInstance: Client,
  options: GooglePayOptions,
  environment: EnvironmentType,
  amount: PaymentAmount,
  onPaymentRequestable: (
    button: HTMLElement,
    payload: PaymentPayload
  ) => Promise<void>,
  onPaymentError: PaymentErrorHandler,
  onPaymentStart?: (event: MouseEvent, element: HTMLElement) => boolean | void
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
        if (onPaymentStart && onPaymentStart(event, button) === false) return;

        try {
          // Load payment data
          const paymentData = await paymentClient.loadPaymentData(request);

          // Parse payment data response
          const paymentResponse = await paymentInstance.parseResponse(
            paymentData
          );

          onPaymentRequestable(button, paymentResponse);
        } catch (ex) {
          onPaymentError(button, "googlePay", ex);
        }
      });
    };
  }
}

async function createPaypal(
  clientInstance: Client,
  options: PaypalOptions,
  environment: EnvironmentType,
  amount: PaymentAmount,
  onPaymentRequestable: (
    button: HTMLElement,
    payload: PaymentPayload
  ) => Promise<void>,
  onPaymentError: PaymentErrorHandler,
  onPaymentStart?: (event: MouseEvent, element: HTMLElement) => boolean | void
): Promise<React.RefCallback<HTMLElement>> {
  const {
    buttonStyle,
    debug = environment === "TEST",
    fundingSource = "paypal",
    merchantAccountId,
    intent = "capture",
    vault = false,

    ...rest
  } = options;

  // https://braintree.github.io/braintree-web/current/module-braintree-web_paypal.html#.create
  const payInstance = await paypalCheckout.create({
    client: clientInstance,
    merchantAccountId
  });

  // Enable or disable funding resources within the portal site
  // Not in configuration
  // https://developer.paypal.com/docs/checkout/standard/customize/standalone-buttons/
  await payInstance.loadPayPalSDK({
    currency: amount.currency,
    components: "buttons,funding-eligibility" as any,
    intent,
    debug,
    vault,
    ...rest
  });

  // Funding source items
  const fundingSourceItems =
    typeof fundingSource === "string"
      ? fundingSource.split(/\s*,\s*/g)
      : fundingSource;

  const paypal = globalThis.paypal;

  return (container) => {
    if (container == null) return;

    if (container.id === "") container.id = "paypal-container";
    const isOneFundingSource = fundingSourceItems.length === 1;

    fundingSourceItems.forEach((fundingSource) => {
      try {
        const style =
          buttonStyle == null
            ? undefined
            : fundingSource in buttonStyle
            ? (buttonStyle as any)[fundingSource]
            : buttonStyle;

        const flow = vault ? "vault" : "checkout";
        const button = paypal.Buttons({
          style,
          fundingSource,
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
                onPaymentRequestable(container, payload);
                return payload;
              },
              (reason) => {
                onPaymentError(container, "paypal", reason);
                return {} as paypal.AuthorizationResponse;
              }
            );
          },
          onClick() {
            if (
              onPaymentStart &&
              onPaymentStart(new MouseEvent("click"), container) === false
            )
              return;
          },
          onCancel(data) {
            const error = new EtsooBraintreeDataError(
              "PayPal payment cancelled",
              data
            );
            error.cause = "cancel";

            onPaymentError(container, "paypal", error);
          },
          onError(err) {
            onPaymentError(container, "paypal", err);
          }
        });

        if (isOneFundingSource) {
          button.render(`#${container.id}`);
        } else {
          const containerId = `fundingsource-${fundingSource}`;
          const sourceContainer = document.getElementById(containerId);
          if (sourceContainer == null) {
            if (onPaymentError) {
              const error = new Error(
                `No container ${containerId} defined for the funding source ${fundingSource}`
              );
              onPaymentError(container, "paypal", error);
            }
          } else {
            const isEligible: boolean =
              "isEligible" in button && typeof button.isEligible === "function"
                ? button.isEligible()
                : true;

            const isEligibleTrueClass = "paypal-eligible-true";
            const isEligibleFalseClass = "paypal-eligible-false";
            if (isEligible) {
              sourceContainer.classList.remove(isEligibleFalseClass);
              sourceContainer.classList.add(isEligibleTrueClass);
            } else {
              sourceContainer.classList.remove(isEligibleTrueClass);
              sourceContainer.classList.add(isEligibleFalseClass);
            }

            if (isEligible) button.render(`#${containerId}`);
          }
        }
      } catch (ex) {
        onPaymentError(container, "paypal", ex);
      }
    });
  };
}

async function createLocalPayment(
  clientInstance: Client,
  options: LocalPaymentOptions,
  environment: EnvironmentType,
  amount: PaymentAmount,
  onPaymentRequestable: (
    button: HTMLElement,
    payload: PaymentPayload
  ) => Promise<void>,
  onPaymentError: PaymentErrorHandler,
  onPaymentStart?: (event: MouseEvent, element: HTMLElement) => boolean | void
): Promise<React.RefCallback<HTMLElement>> {
  const {
    countryCode,
    fallback,
    merchantAccountId,
    method,
    onLocalPaymentStart,
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
      if (onPaymentStart && onPaymentStart(event, button) === false) return;

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
            if (onLocalPaymentStart) {
              onLocalPaymentStart(data).then(
                () => start(),
                (reason) => {
                  onPaymentError(button, method, reason);
                }
              );
            } else {
              // Call start to initiate the popup
              start();
            }
          },
          ...personalData
        });

        onPaymentRequestable(button, payload);
      } catch (ex) {
        onPaymentError(button, method, ex);
      }
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
    threeDSecure: threeDSecureEnabled,

    alipay,
    applePay,
    card,
    googlePay,
    paypal,

    onError = (reason) => console.log(reason),
    onLoading = () => "...",
    onPaymentError,
    onPaymentRequestable,
    onPaymentStart,
    onPaymentEnd,
    onTeardown = () => console.log("Teardown")
  } = props;

  // Default callback
  const onPaymentRequestableLocal = async (
    button: HTMLElement,
    payload: PaymentPayload
  ) => {
    await onPaymentRequestable(payload);
    if (onPaymentEnd) onPaymentEnd(button);
  };

  const onPaymentErrorLocal: PaymentErrorHandler = (button, method, reason) => {
    if (onPaymentError) onPaymentError(method, reason);
    if (onPaymentEnd) onPaymentEnd(button);
  };

  // States
  const [methods, setMethods] = React.useState<PaymentMethods>();
  const isMounted = React.useRef<boolean>();
  const hostedFieldsRef = React.useRef<HostedFields>();

  React.useEffect(() => {
    let newClient: Client | undefined;

    let threeDSecureInstance: ThreeDSecure | undefined;
    const handler = (
      data?: ThreeDSecureVerificationData,
      next?: () => void
    ) => {
      console.log("lookup-complete", data);
      if (next) next();
    };

    client.create({ authorization }).then(
      async (clientInstance) => {
        // Cache the client
        newClient = clientInstance;
        isMounted.current = true;

        // Payment methods
        const items: PaymentMethods = {};

        threeDSecureInstance = threeDSecureEnabled
          ? await threeDSecure.create({ client: clientInstance, version: 2 })
          : undefined;

        if (threeDSecureInstance) {
          threeDSecureInstance.on("lookup-complete", handler);
        }

        if (alipay) {
          try {
            const alipayRef = await createLocalPayment(
              clientInstance,
              { ...alipay, method: "alipay" },
              environment,
              amount,
              onPaymentRequestableLocal,
              onPaymentErrorLocal,
              onPaymentStart
            );
            items.alipay = alipayRef;
          } catch (error) {
            onError("alipay", error);
          }
        }

        if (applePay) {
          try {
            if (
              "ApplePaySession" in globalThis &&
              ApplePaySession.supportsVersion(3) &&
              ApplePaySession.canMakePayments()
            ) {
              const applePayRef = await createApplePay(
                clientInstance,
                applePay,
                environment,
                amount,
                onPaymentRequestableLocal,
                onPaymentErrorLocal,
                onPaymentStart
              );
              items.applePay = applePayRef;
            } else {
              console.log("This device does not support Apple Pay");
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
              amount,
              hostedFieldsRef,
              onPaymentRequestableLocal,
              onPaymentErrorLocal,
              threeDSecureInstance,
              onPaymentStart
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
              onPaymentRequestableLocal,
              onPaymentErrorLocal,
              onPaymentStart
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
              onPaymentRequestableLocal,
              onPaymentErrorLocal,
              onPaymentStart
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
      if (threeDSecureInstance)
        threeDSecureInstance.off("lookup-complete", handler);

      if (hostedFieldsRef.current) {
        hostedFieldsRef.current.teardown();
        hostedFieldsRef.current = undefined;
      }

      setMethods(undefined);

      if (newClient) {
        newClient.teardown(onTeardown);
      }
      isMounted.current = false;
    };
  }, [authorization, amount]);

  const childrenUI = React.useMemo(
    () =>
      methods == null || !isMounted.current
        ? onLoading()
        : children(methods, amount),
    [methods, amount, onLoading, isMounted.current]
  );

  return <React.Fragment>{childrenUI}</React.Fragment>;
}
