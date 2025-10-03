import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { assetMock } from "App/Common/__mocks__/assets";
import { SelectedAsset } from "App/Common/SelectedAsset"; // Adjust the path accordingly
import { Asset } from "types";

describe("SelectedAsset", () => {
  it("renders disabled", () => {
    render(<SelectedAsset isDisabled />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("renders with no asset selected", () => {
    const mockFn = jest.fn();
    render(<SelectedAsset onClick={mockFn} />);

    const button = screen.getByRole("button");
    expect(button).toBeEnabled();

    const assetLabel = screen.getByText(/asset/i);
    expect(assetLabel).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("renders with asset selected", () => {
    const handleClick = jest.fn();
    render(<SelectedAsset asset={assetMock as Asset} onClick={handleClick} />);

    const button = screen.getByRole("button");
    expect(button).toBeEnabled();

    const assetDenomination = screen.getByText(assetMock.symbol!);
    expect(assetDenomination).toBeInTheDocument();

    const assetImage = screen.getByAltText(`${assetMock.name} image`);
    expect(assetImage).toHaveAttribute("src", assetMock.logo_URIs?.svg);

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when the button is disabled", () => {
    const handleClick = jest.fn();
    render(<SelectedAsset isDisabled onClick={handleClick} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
