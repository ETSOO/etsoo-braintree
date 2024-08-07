import React from "react";
import { EtsooBraintree } from "../src/index";
import { act, render, screen } from "@testing-library/react";

it("Initialization tests", async () => {
  // Arrange
  const onError = jest.fn();

  const loadingText = "Loading...";
  const onLoading = jest.fn(() => loadingText);

  // Act
  act(() => {
    render(
      <EtsooBraintree
        amount={{ currency: "NZD", total: 100 }}
        authorization="abc"
        onLoading={onLoading}
        onPaymentRequestable={(payload) => Promise.resolve()}
        onError={onError}
      >
        {() => <div>body</div>}
      </EtsooBraintree>
    );
  });

  // Assert
  expect(await screen.findByText(loadingText)).toBeInstanceOf(HTMLElement);
  expect(onError).toBeCalled();
  expect(onLoading).toBeCalled();
});
