import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { assetMockList } from "App/Common/__mocks__/assets";
import { SwapSelectAssetModal } from "../SwapSelectAssetModal";

jest.mock("hooks/useIsChannelInactive", () => ({
  useIsChannelInactive: jest.fn(() => ({
    isInactive: false,
    trace: "",
  })),
}));

// Mock the getAvailableChains function
jest.mock("atoms/integrations", () => ({
  ...jest.requireActual("atoms/integrations"),
  getAvailableChains: jest.fn(() => []),
}));

describe("SwapSelectAssetModal", () => {
  const onCloseMock = jest.fn();
  const onSelectMock = jest.fn();
  const mockAddress = "cosmos1xnu3p06fkke8hnl7t83hzhggrca59syf0wjqgh";

  it("should render the modal title", () => {
    render(
      <SwapSelectAssetModal
        onClose={onCloseMock}
        onSelect={onSelectMock}
        assets={assetMockList}
        walletAddress={mockAddress}
      />
    );
    expect(screen.getByText("Select Asset")).toBeInTheDocument();
  });

  it("should render all assets", () => {
    render(
      <SwapSelectAssetModal
        onClose={onCloseMock}
        onSelect={onSelectMock}
        assets={assetMockList}
        walletAddress={mockAddress}
      />
    );
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("ETH")).toBeInTheDocument();
  });

  it("should filter assets based on search input", async () => {
    render(
      <SwapSelectAssetModal
        onClose={onCloseMock}
        onSelect={onSelectMock}
        assets={assetMockList}
        walletAddress={mockAddress}
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/search/i, { exact: false }), {
      target: { value: "bit" },
    });

    // Event is debounced
    waitFor(() => {
      expect(screen.getByText("Bitcoin")).toBeInTheDocument();
      expect(screen.queryByText("Ethereum")).not.toBeInTheDocument();
    });
  });

  it("should call onSelect and onClose when an asset is selected", () => {
    render(
      <SwapSelectAssetModal
        onClose={onCloseMock}
        onSelect={onSelectMock}
        assets={assetMockList}
        walletAddress={mockAddress}
      />
    );
    fireEvent.click(screen.getByText("BTC"));
    expect(onSelectMock).toHaveBeenCalledWith(assetMockList[1].address);
    expect(onCloseMock).toHaveBeenCalled();
  });
});
