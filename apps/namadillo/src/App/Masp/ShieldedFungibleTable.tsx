import {
  ActionButton,
  SkeletonLoading,
  TableRow,
  Tooltip,
} from "@namada/components";
import { sortedTableData } from "App/AccountOverview/common";
import { FiatCurrency } from "App/Common/FiatCurrency";
import { IconTooltip } from "App/Common/IconTooltip";
import { TableWithPaginator } from "App/Common/TableWithPaginator";
import { TokenCard } from "App/Common/TokenCard";
import { TokenCurrency } from "App/Common/TokenCurrency";
import { params, routes } from "App/routes";
import { applicationFeaturesAtom } from "atoms/settings/atoms";
import BigNumber from "bignumber.js";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { FaExclamation } from "react-icons/fa6";
import { IoSwapHorizontal } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { TokenBalance } from "types";
import { namadaAsset } from "utils";

const resultsPerPage = 100;
const initialPage = 0;

// Minimum thresholds to earn rewards for each asset
const REWARD_THRESHOLDS: Record<string, BigNumber> = {
  statom: new BigNumber(10),
  stosmo: new BigNumber(100),
  sttia: new BigNumber(20),
  osmo: new BigNumber(100),
  atom: new BigNumber(10),
  tia: new BigNumber(20),
  usdc: new BigNumber(50),
};

// Check if amount is below the minimum threshold to earn rewards
const isBelowRewardThreshold = (
  assetSymbol: string,
  amount: BigNumber
): boolean => {
  const threshold = REWARD_THRESHOLDS[assetSymbol.toLowerCase()];
  return threshold ? amount.lt(threshold) : false;
};

export const ShieldedFungibleTable = ({
  data,
  rewards,
}: {
  data: TokenBalance[];
  rewards: Record<string, BigNumber> | undefined;
}): JSX.Element => {
  const [page, setPage] = useState(initialPage);
  const navigate = useNavigate();
  const { shieldingRewardsEnabled } = useAtomValue(applicationFeaturesAtom);

  const headers = ["Token", { children: "Balance", className: "text-right" }];
  if (shieldingRewardsEnabled) {
    headers.push({
      children: "Rewards est next 24hrs",
      className: "text-right",
    });
  }

  const renderRow = ({
    address,
    asset,
    amount,
    dollar,
  }: TokenBalance): TableRow => {
    const reward = rewards?.[address];
    const belowThreshold = isBelowRewardThreshold(asset.symbol, amount);
    return {
      cells: [
        <TokenCard key={`token-${address}`} address={address} asset={asset} />,
        <div
          key={`balance-${address}`}
          className="flex flex-col text-right leading-tight"
        >
          <TokenCurrency symbol={asset.symbol} amount={amount} />
          {dollar && (
            <FiatCurrency
              className="text-neutral-600 text-sm"
              amount={dollar}
            />
          )}
        </div>,
        <div
          key={`ssr-rate-${address}`}
          className="text-right leading-tight relative"
        >
          {shieldingRewardsEnabled &&
            REWARD_THRESHOLDS[asset.symbol.toLowerCase()] &&
            (reward ?
              <div className="flex items-center justify-end gap-2">
                <TokenCurrency
                  symbol={namadaAsset().symbol}
                  amount={reward}
                  className="text-yellow"
                  decimalPlaces={reward.isZero() ? 0 : 3}
                />
                {belowThreshold && (
                  <IconTooltip
                    className="bg-yellow text-black"
                    icon={<FaExclamation />}
                    text={`${REWARD_THRESHOLDS[asset.symbol.toLowerCase()]} ${asset.symbol} required to earn rewards`}
                    tooltipClassName="w-fit px-2 py-1 -mr-2"
                    tooltipPosition="right"
                  />
                )}
              </div>
            : <SkeletonLoading
                width="120px"
                height="20px"
                className="float-right"
              />)}
        </div>,
        <div
          key={`unshield-${address}`}
          className="flex items-center text-neutral-450"
        >
          <ActionButton
            size="xs"
            outlineColor="white"
            className="w-fit ml-auto mr-10"
            onClick={() =>
              navigate(`${routes.maspUnshield}?${params.asset}=${address}`)
            }
          >
            Unshield
          </ActionButton>
          <div key={`swap-${address}`} className="relative group/tooltip mr-5">
            <Link
              to={`${routes.transfer}?${params.asset}=${address}&${params.shielded}=0`}
              className={twMerge(
                "bg-black rounded-full w-10 h-10 flex items-center justify-center p-0",
                "hover:bg-white hover:text-black transition-all duration-300"
              )}
            >
              <IoSwapHorizontal className="h-[20px] w-[20px]" />
            </Link>
            <Tooltip position="top" className="w-[80px] -mt-2 -ml-2">
              Transfer
            </Tooltip>
          </div>
        </div>,
      ],
    };
  };

  useEffect(() => {
    setPage(0);
  }, [data]);

  const sortedData = sortedTableData(data);
  const paginatedItems = sortedData.slice(
    page * resultsPerPage,
    page * resultsPerPage + resultsPerPage
  );

  const pageCount = Math.ceil(data.length / resultsPerPage);

  return (
    <>
      <div className="text-sm font-medium ml-4">
        <span className="text-yellow">{data.length} </span>
        Tokens
      </div>
      <TableWithPaginator
        id="shielded-tokens"
        headers={headers.concat("")}
        renderRow={renderRow}
        itemList={paginatedItems}
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        tableProps={{
          className: twMerge(
            "w-full flex-1 [&_td]:px-1 [&_th]:px-1 [&_td:first-child]:pl-4 [&_td]:h-[64px]",
            "[&_td]:font-normal [&_th:first-child]:pl-4 [&_th:last-child]:pr-4",
            "[&_td:first-child]:rounded-s-md [&_td:last-child]:rounded-e-md",
            "mt-5"
          ),
        }}
        headProps={{ className: "text-neutral-500" }}
      />
    </>
  );
};
