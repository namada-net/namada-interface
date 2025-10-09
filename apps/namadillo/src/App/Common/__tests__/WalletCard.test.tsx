import { fireEvent, render, screen } from "@testing-library/react";
import { walletMock } from "App/Common/__mocks__/providers";
import { WalletCard } from "App/Common/WalletCard";

describe("Component: WalletCard", () => {
  it("should render wallet name and icon", () => {
    render(
      <WalletCard wallet={walletMock} installed={false} connected={false} />
    );

    expect(screen.getByText("Keplr")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", walletMock.iconUrl);
  });

  it("should show 'Connect' button if wallet is installed but not connected", () => {
    const onConnectMock = jest.fn();
    render(
      <WalletCard
        wallet={walletMock}
        installed={true}
        connected={false}
        onConnect={onConnectMock}
      />
    );

    const connectButton = screen.getByText(/connect/i);
    expect(connectButton).toBeInTheDocument();

    fireEvent.click(connectButton);
    expect(onConnectMock).toHaveBeenCalled();
  });

  it("should show 'Select' button if wallet is installed and connected", () => {
    const onSelectMock = jest.fn();
    render(
      <WalletCard
        wallet={walletMock}
        installed={true}
        connected={true}
        onSelect={onSelectMock}
      />
    );

    const selectButton = screen.getByText(/select/i);
    expect(selectButton).toBeInTheDocument();

    fireEvent.click(selectButton);
    expect(onSelectMock).toHaveBeenCalled();
  });
});
