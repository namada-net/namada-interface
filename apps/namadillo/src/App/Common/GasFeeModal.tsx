import {
  ActionButton,
  AmountInput,
  Modal,
  StyledSelectBox,
} from "@namada/components";
import { transparentBalanceAtom } from "atoms/accounts";
import { shieldedBalanceAtom } from "atoms/balance";
import { nativeTokenAddressAtom } from "atoms/chain";
import { GasPriceTable, GasPriceTableItem } from "atoms/fees/atoms";
import { tokenPricesFamily } from "atoms/prices/atoms";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { TransactionFeeProps } from "hooks/useTransactionFee";
import { useAtomValue } from "jotai";
import { IoClose } from "react-icons/io5";
import { twMerge } from "tailwind-merge";
import { Asset, GasConfig, NamadaAsset } from "types";
import { toDisplayAmount } from "utils";
import { getDisplayGasFee } from "utils/gas";
import { FiatCurrency } from "./FiatCurrency";
import { TokenCard } from "./TokenCard";
import { TokenCurrency } from "./TokenCurrency";

const useSortByNativeToken = () => {
  const nativeToken = useAtomValue(nativeTokenAddressAtom).data;
  return (a: GasPriceTableItem, b: GasPriceTableItem) =>
    a.token.address === nativeToken ? -1
    : b.token.address === nativeToken ? 1
    : 0;
};

const useBuildGasOption = ({
  gasConfig,
  gasPriceTable,
  chainAssetsMap,
}: {
  gasConfig: GasConfig;
  gasPriceTable: GasPriceTable | undefined;
  chainAssetsMap: Record<string, NamadaAsset>;
}) => {
  const gasDollarMap =
    useAtomValue(
      tokenPricesFamily(gasPriceTable?.map((item) => item.token.address) ?? [])
    ).data ?? {};

  return (
    override: Partial<GasConfig>
  ): {
    option: GasConfig;
    selected: boolean;
    disabled: boolean;
    displayAmount: BigNumber;
    asset: Asset;
    totalInDollars?: BigNumber;
    unitValueInDollars?: BigNumber;
  } => {
    const option: GasConfig = {
      ...gasConfig,
      ...override,
    };

    const displayGasFee = getDisplayGasFee(option, chainAssetsMap);
    const { totalDisplayAmount: displayAmount, asset } = displayGasFee;

    const unitValueInDollars = gasDollarMap[option.gasToken];
    const totalInDollars =
      unitValueInDollars ?
        unitValueInDollars.multipliedBy(displayAmount)
      : undefined;

    const selected =
      !gasConfig.gasLimit.isEqualTo(0) &&
      option.gasLimit.isEqualTo(gasConfig.gasLimit) &&
      option.gasPriceInMinDenom.isEqualTo(gasConfig.gasPriceInMinDenom) &&
      option.gasToken === gasConfig.gasToken;

    const disabled =
      gasConfig.gasLimit.isEqualTo(0) ||
      gasConfig.gasPriceInMinDenom.isEqualTo(0);

    return {
      option,
      selected,
      disabled,
      asset,
      displayAmount,
      totalInDollars,
      unitValueInDollars,
    };
  };
};

export const GasFeeModal = ({
  feeProps,
  onClose,
  chainAssetsMap,
  isShielded = false,
}: {
  feeProps: TransactionFeeProps;
  onClose: () => void;
  chainAssetsMap: Record<string, NamadaAsset>;
  isShielded?: boolean;
}): JSX.Element => {
  const {
    gasConfig,
    gasEstimate,
    gasPriceTable,
    onChangeGasLimit,
    onChangeGasToken,
  } = feeProps;

  const sortByNativeToken = useSortByNativeToken();
  const buildGasOption = useBuildGasOption({
    gasConfig,
    gasPriceTable,
    chainAssetsMap,
  });
  const nativeToken = useAtomValue(nativeTokenAddressAtom).data;
  const transparentAmount = useAtomValue(transparentBalanceAtom);
  const shieldedAmount = useAtomValue(shieldedBalanceAtom);

  const findUserBalanceByTokenAddress = (tokenAddres: string): BigNumber => {
    // TODO: we need to refactor userShieldedBalances to return Balance[] type instead
    const balances =
      isShielded ?
        shieldedAmount.data?.map((balance) => ({
          minDenomAmount: balance.minDenomAmount,
          token: balance.address,
        }))
      : transparentAmount.data;

    return new BigNumber(
      balances?.find((token) => token.token === tokenAddres)?.minDenomAmount ||
        "0"
    );
  };

  const filterAvailableTokensOnly = (item: GasPriceTableItem): boolean => {
    if (item.token.address === nativeToken) return true; // we should always keep the native token
    return findUserBalanceByTokenAddress(item.token.address).gt(0);
  };

  const isLoading = isShielded && !shieldedAmount.data;

  return (
    <Modal onClose={onClose}>
      <div
        className={twMerge(
          "fixed min-w-[550px] top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2",
          "px-6 py-7 bg-black border border-neutral-500 rounded-md"
        )}
      >
        <i
          className={twMerge(
            "cursor-pointer text-white absolute right-3 top-3 text-xl",
            "hover:text-yellow transition-colors"
          )}
          onClick={onClose}
        >
          <IoClose />
        </i>
        <h2 className="text-xl font-medium">Fee Options</h2>
        <div className="text-sm">
          Gas fees deducted from your Namada accounts
        </div>
        <div className="text-sm mt-8 mb-1">Fee</div>
        <div className="grid grid-cols-3 rounded-sm overflow-hidden">
          {[
            { label: "Low", amount: gasEstimate?.min ?? 0 },
            { label: "Average", amount: gasEstimate?.avg ?? 0 },
            { label: "High", amount: gasEstimate?.max ?? 0 },
          ].map((item) => {
            const { asset, displayAmount, totalInDollars, selected, disabled } =
              buildGasOption({
                gasLimit: BigNumber(item.amount),
              });

            return (
              <button
                key={item.label}
                type="button"
                disabled={disabled}
                className={twMerge(
                  "flex flex-col justify-center items-center flex-1 py-5 leading-4",
                  "transition-colors duration-150 ease-out-quad",
                  selected ?
                    "cursor-auto bg-yellow text-black"
                  : "cursor-pointer bg-neutral-800 hover:bg-neutral-700"
                )}
                onClick={() => onChangeGasLimit(BigNumber(item.amount))}
              >
                <div className="font-semibold">{item.label}</div>
                {totalInDollars && (
                  <FiatCurrency
                    amount={totalInDollars}
                    className="text-xs text-neutral-500 font-medium"
                  />
                )}
                <TokenCurrency
                  amount={displayAmount}
                  symbol={asset.symbol}
                  className="font-semibold mt-1"
                />
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-[1.5fr_1fr_1fr] mb-1 mt-8 pr-9 gap-1">
          <span className="text-sm">Fee Token</span>
          <span className="text-xs text-neutral-500 text-right">Balance</span>
          <span className="text-xs text-neutral-500 text-right">Fee</span>
        </div>

        <StyledSelectBox
          id="fee-token-select"
          disabled={isLoading}
          value={gasConfig.gasToken}
          containerProps={{
            className: twMerge(
              "text-sm w-full flex-1 border border-white rounded-sm",
              "px-4 py-[9px]"
            ),
          }}
          arrowContainerProps={{ className: "right-4" }}
          listContainerProps={{
            className: clsx(
              "w-full mt-6 border border-neutral-700 max-h-[300px]",
              "overflow-y-auto px-2"
            ),
          }}
          listItemProps={{
            className: clsx(
              "border-0 pl-4 pr-7 rounded-sm",
              "[&_label]:!group-hover/item:text-current",
              "border border-transparent rounded-sm",
              "hover:border-neutral-500 transition-colors"
            ),
          }}
          labelProps={{
            className: "group-hover/item:text-current",
          }}
          onChange={(e) => onChangeGasToken(e.target.value)}
          options={
            gasPriceTable
              ?.filter(filterAvailableTokensOnly)
              .sort(sortByNativeToken)
              .map((item) => {
                const {
                  asset,
                  displayAmount,
                  totalInDollars,
                  unitValueInDollars,
                } = buildGasOption({
                  gasPriceInMinDenom: item.gasPriceInMinDenom,
                  gasToken: item.token.address,
                });

                const availableAmount = toDisplayAmount(
                  asset,
                  findUserBalanceByTokenAddress(item.token.address)
                );

                return {
                  id: item.token.address,
                  value: (
                    <div
                      className={clsx(
                        "grid grid-cols-[1.5fr_1fr_1fr] items-center gap-4",
                        "justify-between w-full min-h-[42px] mr-5"
                      )}
                    >
                      <TokenCard address={item.token.address} asset={asset} />
                      <div>
                        <div className="text-white text-sm text-right">
                          {unitValueInDollars && (
                            <FiatCurrency
                              amount={unitValueInDollars.multipliedBy(
                                availableAmount
                              )}
                            />
                          )}
                        </div>
                        <div className="text-neutral-500 text-xs text-right">
                          <TokenCurrency
                            amount={availableAmount}
                            symbol={asset.symbol}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        {isLoading ?
                          <i
                            className={clsx(
                              "inline-block w-4 h-4 border-2",
                              "border-transparent border-t-yellow rounded-[50%]",
                              "animate-loadingSpinner"
                            )}
                          />
                        : <>
                            {totalInDollars && (
                              <FiatCurrency amount={totalInDollars} />
                            )}
                            <div className="text-neutral-500 text-xs">
                              <TokenCurrency
                                amount={displayAmount}
                                symbol={asset.symbol}
                              />
                            </div>
                          </>
                        }
                      </div>
                    </div>
                  ),
                  ariaLabel: asset.symbol,
                };
              }) ?? []
          }
        />

        <div className="mt-6">
          <AmountInput
            label="Gas Amount"
            className="[&_input]:border-neutral-800"
            value={gasConfig.gasLimit}
            onChange={(e) => e.target.value && onChangeGasLimit(e.target.value)}
          />
        </div>

        <div className="mt-8">
          <ActionButton
            size="sm"
            className="max-w-[200px] mx-auto"
            backgroundColor="gray"
            backgroundHoverColor="yellow"
            textColor="white"
            textHoverColor="black"
            onClick={onClose}
          >
            Close
          </ActionButton>
        </div>
      </div>
    </Modal>
  );
};
