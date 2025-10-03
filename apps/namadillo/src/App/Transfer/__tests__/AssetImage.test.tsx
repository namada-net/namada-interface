import { render, screen } from "@testing-library/react";
import { AssetImage } from "App/Transfer/AssetImage";

import { Asset } from "types";
import { assetMock, assetWithoutLogo } from "../../Common/__mocks__/assets";

jest.mock("integrations/utils", () => ({
  getAssetImageUrl: jest.fn((asset: Asset) =>
    asset ? `mock-url/${asset.symbol}` : ""
  ),
}));

describe("Component: AssetImage", () => {
  it("should render asset logo if available", () => {
    render(<AssetImage asset={assetMock} />);
    const logo = screen.getByAltText("Ethereum logo");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "mock-url/ETH");
  });

  it("should render placeholder if logo is not available", () => {
    render(<AssetImage asset={assetWithoutLogo} />);
    expect(screen.getByAltText(/logo not available/i)).toBeInTheDocument();
  });

  it("renders the shielded badge when isShielded is true", () => {
    render(<AssetImage asset={assetMock} isShielded={true} />);
    const badgeElement = screen.getByAltText(/Namada logo/i);
    expect(badgeElement).toBeInTheDocument();
    expect(badgeElement).toHaveAttribute("src", "mock-url/NAM");
  });

  it("renders the shielded badge when isShielded is false", () => {
    render(<AssetImage asset={assetMock} isShielded={false} />);
    const badgeElement = screen.getByAltText(/Namada logo/i);
    expect(badgeElement).toBeInTheDocument();
  });

  it("don't render the shielded badge when isShielded is undefined", () => {
    render(<AssetImage asset={assetMock} />);
    const badgeElement = screen.queryByAltText(/Namada logo/i);
    expect(badgeElement).not.toBeInTheDocument();
  });
});
