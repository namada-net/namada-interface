import { render, screen } from "@testing-library/react";
import { assetMock } from "App/Transfer/__mocks__/assets";
import BigNumber from "bignumber.js";
import { Asset } from "types";
import { AvailableAmountFooter } from "../AvailableAmountFooter";

describe("Component: AvailableAmountFooter", () => {
  it("should render an empty tag when no available amount is provided", () => {
    const { container } = render(<AvailableAmountFooter />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should not display MAX button when no callback was provided", () => {
    render(
      <AvailableAmountFooter
        availableAmountMinusFees={new BigNumber(100)}
        asset={assetMock as Asset}
      />
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
