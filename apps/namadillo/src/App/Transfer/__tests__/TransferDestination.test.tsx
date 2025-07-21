import BigNumber from "bignumber.js";
jest.mock("../assets/ibc-transfer-white.png", () => "ibc-transfer-white.png");
jest.mock("../../Common/GasFeeModal", () => null);

import { fireEvent, render, screen } from "@testing-library/react";
import { TransferDestination } from "App/Transfer/TransferDestination";
import { namadaAsset } from "utils";

describe("Component: TransferDestination", () => {
  it("should render the component with the default props", () => {
    render(<TransferDestination />);
    const chainButton = screen.queryByText(/select chain/i);
    expect(chainButton).not.toBeInTheDocument();
  });

  it("should render the TabSelector for shielded/transparent when onChangeShielded is provided", () => {
    render(<TransferDestination isShieldedAddress={true} />);
    expect(screen.getByText("Shielded")).toBeInTheDocument();
    expect(screen.getByText("Transparent")).toBeInTheDocument();
  });

  it("should render a yellow border when transfer is shielded", () => {
    const { container } = render(
      <TransferDestination isShieldedAddress={true} />
    );
    expect(container.firstElementChild?.className).toContain("border-yellow");
  });

  it("should render nothing related to shielding when provided chain is not Namada", () => {
    render(<TransferDestination isShieldedAddress={true} />);
    expect(screen.queryByText(/shielded/i)).not.toBeInTheDocument();
  });

  it("should render correct chain name when shielded transfer is set", () => {
    render(<TransferDestination isShieldedAddress={true} />);
    expect(screen.getByText(/namada shielded/i)).toBeInTheDocument();
  });

  it("should render correct chain name when transparent transfer is set", () => {
    render(<TransferDestination isShieldedAddress={false} />);
    expect(screen.getByText(/namada transparent/i)).toBeInTheDocument();
  });

  it("should toggle between shielded and transparent", () => {
    const onChangeShieldedMock = jest.fn();
    render(<TransferDestination isShieldedAddress={true} />);
    const transparentButton = screen.getByText("Transparent");
    fireEvent.click(transparentButton);
    expect(onChangeShieldedMock).toHaveBeenCalledWith(false);
  });

  it("should display the transaction fee if provided", () => {
    render(
      <TransferDestination
        gasDisplayAmount={new BigNumber("0.000002")}
        gasAsset={namadaAsset()}
      />
    );
    const transactionFee = screen.getByText("Fee:");
    expect(transactionFee).toBeInTheDocument();
    expect(transactionFee.parentNode?.textContent).toContain("0.000002");
  });
});
