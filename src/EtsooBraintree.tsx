import {
  Client,
  HostedFieldFieldOptions,
  client,
  googlePayment,
  hostedFields
} from "braintree-web";
import React from "react";
import { GooglePayOptions } from "./methods/GooglePayOptions";
import { CardOptions } from "./methods/CardOptions";
import { EnvironmentType } from "./data/EnvironmentType";
import { PaymentMethods } from "./data/PaymentMethods";
import { PaymentAmount } from "./data/PaymentAmount";
import { HostedFieldsField } from "braintree-web/modules/hosted-fields";
import { HostedFieldFieldType } from "./data/HostedFieldFieldType";

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
   * Card payment
   */
  card?: CardOptions;

  /**
   * Children renderer
   */
  children: (methods: PaymentMethods, amount: PaymentAmount) => React.ReactNode;

  /**
   * Environment
   */
  environment?: EnvironmentType;

  /**
   * Google pay
   */
  googlePay?: GooglePayOptions;

  /**
   * Error handling
   */
  onError?: (reason: unknown) => void;

  /**
   * Loading callback
   */
  onLoading?: () => React.ReactNode;

  /**
   * Teardown callback
   */
  onTeardown?: () => void;
};

function loadGooglePayScript() {
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

async function createCard(
  clientInstance: Client,
  card: CardOptions
): Promise<React.RefCallback<HTMLFormElement> | undefined> {
  const { fieldSetup, styles } = card;

  return (form) => {
    if (form == null) return;

    const fields: HostedFieldFieldOptions = {};
    const keys: HostedFieldFieldType[] = ["cardholderName"];
    keys.forEach((key) => {
      const selector = `#${key}`;
      const keyField = form.querySelector(selector) as HTMLInputElement;
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
      .then((fields) => {
        form.addEventListener("submit", (event) => {
          event.preventDefault();

          fields.tokenize((err, payload) => {
            console.log(err, payload);
          });
        });
      });
  };
}

async function createGooglePay(
  clientInstance: Client,
  googlePay: GooglePayOptions,
  environment: EnvironmentType,
  amount: PaymentAmount
): Promise<React.RefCallback<HTMLElement> | undefined> {
  // Load script
  await loadGooglePayScript();

  const { merchantId, totalPriceStatus = "FINAL", version = 2 } = googlePay;

  const paymentInstance = await googlePayment.create({
    client: clientInstance,
    googlePayVersion: version,
    googleMerchantId: merchantId
  });

  const paymentClient = new google.payments.api.PaymentsClient({
    environment
  });

  const request = await paymentInstance.createPaymentDataRequest({
    transactionInfo: {
      currencyCode: amount.currency,
      totalPriceStatus,
      totalPrice: amount.total.toFixed(amount.fractionDigits ?? 2)
    }
  });

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

        const paymentData = await paymentClient.loadPaymentData(request);
        const paymentResponse = await paymentInstance.parseResponse(
          paymentData
        );
        console.log(paymentResponse);
      });
    };
  }
}

export function EtsooBraintree(props: EtsooBraintreePros) {
  // Destruct
  const {
    amount,
    authorization,
    card,
    children,
    environment = "TEST",
    googlePay,
    onError = (reason) => console.log(reason),
    onLoading = () => "...",
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
            const cardRef = await createCard(clientInstance, card);

            if (cardRef == null) {
              onError({
                type: "card",
                message: "GooglePay API isReadyToPay failed"
              });
            } else {
              items.card = cardRef;
            }
          } catch (error) {
            onError({ type: "card", error });
          }
        }

        if (googlePay) {
          try {
            const googlePayRef = await createGooglePay(
              clientInstance,
              googlePay,
              environment,
              amount
            );

            if (googlePayRef == null) {
              onError({
                type: "googlePay",
                message: "GooglePay API isReadyToPay failed"
              });
            } else {
              items.googlePay = googlePayRef;
            }
          } catch (error) {
            onError({ type: "googlePay", error });
          }
        }

        // Update methods
        setMethods(items);
      },
      (reason) => {
        onError(reason);
      }
    );

    return () => {
      isMounted.current = false;
      if (client.teardown) client.teardown(onTeardown);
    };
  }, [authorization]);

  return (
    <React.Fragment>
      {methods == null ? onLoading() : children(methods, amount)}
    </React.Fragment>
  );
}
