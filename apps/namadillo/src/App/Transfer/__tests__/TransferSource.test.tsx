import { fireEvent, render, screen } from "@testing-library/react";
import {
  TransferSource,
  TransferSourceProps,
} from "App/Transfer/TransferSource";
import BigNumber from "bignumber.js";

describe("Component: TransferSource", () => {
  it("should not render chain selector when openChainSelector is not defined", () => {
    render(<TransferSource openProviderSelector={jest.fn()} />);
    const selectChain = screen.queryByText(/selected chain/i);
    expect(selectChain).not.toBeInTheDocument();
  });

  const setup = (props: Partial<TransferSourceProps> = {}): void => {
    render(<TransferSource openProviderSelector={jest.fn()} {...props} />);
  };

  const getEmptyAsset = (): HTMLElement => {
    return screen.getByText(/asset/i);
  };

  it("should call openAssetSelector when the SelectedAsset is clicked", () => {
    const openAssetSelectorMock = jest.fn();
    setup({
      openAssetSelector: openAssetSelectorMock,
    });
    const assetControl = getEmptyAsset();
    fireEvent.click(assetControl);
    expect(openAssetSelectorMock).toHaveBeenCalled();
  });

  it("should render the amount input with the correct value", () => {
    const amount = new BigNumber(100);
    setup({ amount });
    const amountInput = screen.getByDisplayValue("100");
    expect(amountInput).toBeInTheDocument();
  });

  it("should call onChangeAmount when the amount input is changed", () => {
    const onChangeAmountMock = jest.fn();
    setup({ amount: new BigNumber(0), onChangeAmount: onChangeAmountMock });
    const amountInput = screen.getByDisplayValue("0");
    fireEvent.change(amountInput, { target: { value: new BigNumber("200") } });
    expect(onChangeAmountMock).toHaveBeenCalled();
  });
});
