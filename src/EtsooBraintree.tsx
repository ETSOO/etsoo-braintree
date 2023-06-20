import {
  Client,
  HostedFieldFieldOptions,
  client,
  googlePayment,
  hostedFields,
  paypalCheckout
} from "braintree-web";
import React from "react";
import { GooglePayOptions } from "./methods/GooglePayOptions";
import { CardOptions } from "./methods/CardOptions";
import { EnvironmentType } from "./data/EnvironmentType";
import { PaymentMethod, PaymentMethods } from "./data/PaymentMethods";
import { PaymentAmount } from "./data/PaymentAmount";
import { HostedFieldsField } from "braintree-web/modules/hosted-fields";
import { HostedFieldFieldType } from "./data/HostedFieldFieldType";
import { PaymentPayload } from "./data/PaymentPayload";
import { PaypalOptions } from "./methods/PaypalOptions";

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
  const { billingAddress, fieldSetup, styles, vault } = options;

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
        const field: HostedFieldsField = { selector };
        fields[key] = field;
        if (fieldSetup) fieldSetup(key, keyField, field);
      }
    });

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
  };
}

function loadGooglePayScript() {
  if (google?.payments?.api?.PaymentsClient) return Promise.resolve();

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
    fundingSource = "PAYPAL",
    merchantAccountId,
    intent = "capture"
  } = options;

  const payInstance = await paypalCheckout.create({
    client: clientInstance,
    merchantAccountId
  });

  await payInstance.loadPayPalSDK({
    currency: amount.currency,
    intent
  });

  const paypal = globalThis.paypal;

  return (button) => {
    if (button == null) return;

    try {
      paypal
        .Buttons({
          style: buttonStyle,
          fundingSource: fundingSource,
          createOrder() {
            return payInstance.createPayment({
              flow: paypal.FlowType.Checkout, // Required
              amount: amount.total, // Required
              currency: amount.currency, // Required, must match the currency passed in with loadPayPalSDK

              intent: paypal.Intent.Capture, // Must match the intent passed in with loadPayPalSDK

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
        .render(`#${button.id}`);
    } catch (ex) {
      if (onPaymentError) onPaymentError("googlePay", ex);
    }
  };
}

/**
 * Etsoo Braintree UI component
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
