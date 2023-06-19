import React from "react";
import { EtsooBraintree } from "../src/index";
import { render, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";

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
