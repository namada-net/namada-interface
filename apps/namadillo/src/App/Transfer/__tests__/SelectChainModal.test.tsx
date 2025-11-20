import { Chain } from "@chain-registry/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { namadaChainMock, randomChainMock } from "App/Common/__mocks__/chains";
import { walletMock } from "App/Common/__mocks__/providers";
import { SelectChainModal } from "App/Transfer/SelectChainModal";

// Mock the getAvailableChains function
jest.mock("atoms/integrations", () => ({
  ...jest.requireActual("atoms/integrations"),
  getAvailableChains: jest.fn(() => []),
}));

describe("Component: SelectChainModal", () => {
  const mockChains = [randomChainMock, namadaChainMock];
  const mockAddress = "cosmos1xnu3p06fkke8hnl7t83hzhggrca59syf0wjqgh";

  it("should render component and list of chains correctly", () => {
    render(
      <SelectChainModal
        chains={mockChains as Chain[]}
        onClose={jest.fn()}
        onSelect={jest.fn()}
        wallet={walletMock}
        walletAddress={mockAddress}
      />
    );
    expect(screen.getByText("Namada")).toBeInTheDocument();
    expect(screen.getByText("TestChain")).toBeInTheDocument();

    // Truncated wallet address
    expect(
      screen.getByText("cosmos1x...yf0wjqgh", {
        exact: false,
      })
    ).toBeInTheDocument();

    // Check for modal title
    expect(screen.getByText("Select Source Chain")).toBeInTheDocument();

    // Check if all chains are rendered
    mockChains.forEach((chain) => {
      expect(screen.getByText(chain.pretty_name!)).toBeInTheDocument();
      expect(
        screen.getByAltText(`${chain.pretty_name} logo`)
      ).toBeInTheDocument();
    });
  });

  it("should select the correct chain on click", () => {
    const handleSelect = jest.fn();
    render(
      <SelectChainModal
        onClose={jest.fn()}
        onSelect={handleSelect}
        chains={mockChains as Chain[]}
        wallet={walletMock}
        walletAddress={mockAddress}
      />
    );
    fireEvent.click(screen.getByText(mockChains[0].pretty_name!));
    expect(handleSelect).toHaveBeenCalledWith(mockChains[0]);
  });

  it("should display warning message if no chains were provided", () => {
    const handleSelect = jest.fn();
    render(
      <SelectChainModal
        onClose={jest.fn()}
        onSelect={handleSelect}
        chains={[]}
        wallet={walletMock}
        walletAddress={mockAddress}
      />
    );
    expect(screen.getByText(/no available chains/i, { exact: false }))
      .toBeInTheDocument;
  });
});
