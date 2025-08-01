import { walletMock } from "../__mocks__/providers";
const testWalletAddress = "0x1234567890abcdefghijkl";
const mockIntegration = {
  detect: jest.fn(),
  connect: jest.fn(),
  accounts: jest.fn().mockResolvedValue([{ address: testWalletAddress }]),
};

// Avoid hoisting
(() => {
  jest.mock("@namada/integrations", () => ({
    integrations: {
      [walletMock.id]: mockIntegration,
    },
  }));
})();

import { shortenAddress } from "@namada/utils";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { SelectedWallet } from "App/Transfer/SelectedWallet";

describe("Component: SelectedWallet", () => {
  const tempAddress = "tnam1qzwew8hve4u2620a78n6lmqz0qdc9xwj9vyjpqha";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render the wallet icon", async () => {
    await act(async () => {
      render(<SelectedWallet address={tempAddress} />);
    });
    const walletIcon = screen.getByAltText(/logo/i, { exact: false });
    expect(walletIcon).toBeInTheDocument();
    expect(walletIcon).toHaveAttribute("src", walletMock.iconUrl);
  });

  it("should display the shortened wallet address after loading accounts", async () => {
    render(<SelectedWallet address={tempAddress} />);

    // Check if the address is correctly shortened
    const shortenedAddress = shortenAddress(tempAddress, 8, 8);
    expect(screen.getByText(shortenedAddress)).toBeInTheDocument();
  });

  it("should trigger the onClick function when clicked", async () => {
    const onClickMock = jest.fn();
    await act(async () => {
      render(<SelectedWallet address={tempAddress} onClick={onClickMock} />);
    });
    const walletButton = screen.getByRole("button");
    fireEvent.click(walletButton);
    expect(onClickMock).toHaveBeenCalled();
  });
});
