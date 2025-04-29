import { asset_lists as assetLists } from "@chain-registry/assets";
import { AssetList } from "@chain-registry/types";
import { AccountType, BparamsMsgValue } from "@namada/types";
import {
  calcAmountWithSlippage,
  getExponentByDenom,
  getRoutesForTrade,
  makePoolPairs,
} from "@osmonauts/math";
import { PrettyPair } from "@osmonauts/math/types";
import { defaultAccountAtom } from "atoms/accounts";
import { createOsmosisSwapTxAtom } from "atoms/transfer/atoms";
import BigNumber from "bignumber.js";
import { assets } from "chain-registry";
import invariant from "invariant";
import { useAtomValue } from "jotai";
import { broadcastTransaction, signTx } from "lib/query";
import { osmosis } from "osmojs";
import { Pool } from "osmojs/osmosis/gamm/v1beta1/balancerPool";
import { SwapAmountInRoute } from "osmojs/osmosis/poolmanager/v1beta1/swap_route";
import { useEffect } from "react";
import { getSdkInstance } from "utils/sdk";

let osmosisAssets = assetLists.filter((a) => a.chain_name === "osmosis");

const osmo = assets
  .filter((a) => a.chain_name === "osmosis")[0]
  .assets.find((a) => a.coingecko_id === "osmosis");
const ats = [osmo!, ...osmosisAssets[0].assets];
osmosisAssets[0].assets = ats;
const osmosisAssets0 = filterDuplicatesBySymbol(osmosisAssets[0]);
osmosisAssets = [osmosisAssets0];

export type Token = {
  denom: string;
  symbol: string;
};

export type SwapToken = {
  denom: string;
  symbol: string;
  amount: string;
  value: string;
  $value: string;
};

export type Swap = {
  to: SwapToken;
  from: SwapToken;
  slippage: number;
};

export type SwapInfo = {
  swapFee: {
    value: BigNumber;
    $value: string;
    number: BigNumber;
    percent: {
      number: BigNumber;
      string: string;
    };
  };
  expectedOutput: string;
  minimumReceived?: string;
  display?: SwapInfoDisplay;
};

export type SwapInfoDisplay = {
  swapFee: {
    value: string;
    percent: string;
  };
  expectedOutput: string;
  minimumReceived?: string;
};

export function calcSwapFee(
  pools: Pool[],
  routes: SwapAmountInRoute[] = []
): string {
  if (routes.length === 0) return "0";
  return routes.reduce((total, route) => {
    // TODO: use map instead of find?
    const pool = pools.find((p) => p.id === route.poolId)!;
    return new BigNumber(total).plus(pool.poolParams.swapFee).toString();
  }, "0");
}

export function newSwapInfo(
  swap: Swap,
  pools: Pool[],
  routes: SwapAmountInRoute[] = []
): SwapInfo | null {
  if (routes.length === 0) return null;

  const to = newCoin(swap.to);

  const swapFee = calcSwapFee(pools, routes);
  const swapFeeValue = new BigNumber(swap.from.value || "0")
    .multipliedBy(swapFee)
    .decimalPlaces(2, BigNumber.ROUND_DOWN);
  const swapFeePercent = new BigNumber(swapFee).shiftedBy(2);
  const swapFeePercentString = swapFeePercent.toString() + "%";

  const info = {
    swapFee: {
      value: swapFeeValue,
      $value: `\$${swapFeeValue.decimalPlaces(2).toString()}`,
      number: new BigNumber(swapFee),
      percent: { number: swapFeePercent, string: swapFeePercentString },
    },
    expectedOutput: new BigNumber(swap.to.amount!).decimalPlaces(6).toString(),
    minimumReceived: BigNumber(calcAmountWithSlippage(to.amount, swap.slippage))
      .decimalPlaces(6)
      .toString(),
    display: {} as SwapInfoDisplay,
  };

  // Pad expectedOutput and minimumReceived to the same length
  const maxLength = Math.max(
    info.expectedOutput.length,
    info.minimumReceived.length
  );
  info.expectedOutput = info.expectedOutput.padEnd(maxLength, "0");
  info.minimumReceived = info.minimumReceived.padEnd(maxLength, "0");

  info.display = {
    swapFee: {
      value: `≈ ${swapFeeValue.gt(0.01) ? info.swapFee.$value : "< \$0.01"}`,
      percent: swapFeePercentString,
    },
    expectedOutput: `≈ ${info.expectedOutput!} ${swap.to.symbol}`,
    minimumReceived: `${info.minimumReceived} ${swap.to.symbol}`,
  };

  return info;
}

export const Slippages = [1, 2.5, 3, 5];

export function newCoin(token: SwapToken): { denom: string; amount: string } {
  return {
    denom: token.denom,
    amount: new BigNumber(token.amount || "0")
      .shiftedBy(getExponentByDenom(osmosisAssets, token.denom) || 0)
      .toString(),
  };
}

export function newRoutes(
  swap: Swap,
  pairs: PrettyPair[]
): SwapAmountInRoute[] {
  if (!swap.from.denom || !swap.to.denom) return [];
  const trade = {
    sell: newCoin(swap.from),
    buy: newCoin(swap.to),
  };
  return getRoutesForTrade(osmosisAssets, { trade, pairs });
}

export function newSwap(
  from: Token,
  to: Token,
  amount = "0",
  prices: Record<string, number> = {},
  slippage = Slippages[0]
): Swap {
  const swap: Swap = {
    to: { denom: "", symbol: "", amount: "0", value: "0", $value: "$0" },
    from: { denom: "", symbol: "", amount: "0", value: "0", $value: "$0" },
    slippage,
  };

  if (from && to && prices[from.denom] && prices[to.denom]) {
    swap.from.denom = from.denom;
    swap.from.symbol = from.symbol;
    swap.from.amount = amount;
    swap.from.value = new BigNumber(amount)
      .multipliedBy(prices[from.denom])
      .toString();
    swap.from.$value = `\$${new BigNumber(swap.from.value).decimalPlaces(2).toString()}`;
    swap.to.denom = to.denom;
    swap.to.symbol = to.symbol;
    swap.to.amount = new BigNumber(swap.from.value)
      .div(prices[to.denom])
      .decimalPlaces(6)
      .toString();
    swap.to.value = swap.from.value;
    swap.to.$value = `\$${new BigNumber(swap.to.value).decimalPlaces(2).toString()}`;
  }

  return swap;
}

function filterDuplicatesBySymbol(assetList: AssetList): AssetList {
  const seen = new Set();
  return {
    ...assetList,
    assets: assetList.assets.filter((item) => {
      if (seen.has(item.symbol)) {
        return false; // Skip this item (duplicate)
      } else {
        seen.add(item.symbol);
        return true; // Keep this item (unique)
      }
    }),
  };
}
function denomsInPairs(pairs: PrettyPair[]): string[] {
  return Array.from(
    new Set(pairs.map((pair) => [pair.baseAddress, pair.quoteAddress]).flat())
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPrices(coinGeckoIds: string[]): Promise<any> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds.join()}&vs_currencies=usd`;
  return await fetch(url).then((res) => res.json());
}

export const OsmosisSwap: React.FC = () => {
  const { mutateAsync: performOsmosisSwap } = useAtomValue(
    createOsmosisSwapTxAtom
  );

  useEffect(() => {
    const asd = async (): Promise<void> => {
      const { createRPCQueryClient } = osmosis.ClientFactory;

      const client = await createRPCQueryClient({
        rpcEndpoint: "https://rpc.osmosis.zone",
      });

      const all = await client.osmosis.poolmanager.v1beta1.allPools();
      const freefloat = (all.pools.filter(
        ({ $typeUrl }) => !$typeUrl?.includes("stableswap")
      ) || []) as Pool[];
      const ff2 = freefloat.filter(
        (p) =>
          (p.poolAssets &&
            p.poolAssets[0].token.denom === "uosmo" &&
            p.poolAssets[1].token.denom ===
              "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2") ||
          (p.poolAssets &&
            p.poolAssets[1].token.denom === "uosmo" &&
            p.poolAssets[0].token.denom ===
              "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2")
      );
      console.log("freefloat", ff2);

      const prices = Object.entries<{ usd: number }>(
        await fetchPrices(["cosmos", "osmosis"])
      ).reduce(
        (acc, [key, value]) => {
          // TODO:  Keep a map of coingecko_id->asseet instead of finding
          const base = ats.find((a) => a.coingecko_id === key)?.base as string;
          acc[base] = value.usd;
          return acc;
        },
        {} as Record<string, number>
      );

      console.log("Prices:", prices, osmosisAssets0);
      const pairs = makePoolPairs([osmosisAssets0], ff2, prices); // see pairs data structure at file bottom
      console.log("Pairs:", pairs);
      const toToken = {
        denom: "uosmo",
        symbol: "OSMO",
      };
      const fromToken = {
        denom:
          "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2",
        symbol: "ATOM",
      };
      const swap = newSwap(fromToken, toToken, "0.1", prices, 1);

      console.log("Swap:", swap);
      const routes = newRoutes(swap, pairs);
      console.log("Routes:", routes);
      const swapInfo = newSwapInfo(swap, freefloat, routes);
      if (!swapInfo) {
        console.error("No swap info available");
        return;
      }
      console.log("SwapInfo:", swapInfo);
      console.log("swap fee:", swapInfo?.swapFee.number.toString());

      console.log(
        `Swapping 0.1 of ${fromToken.symbol} equals ${BigNumber(swapInfo.expectedOutput).minus(swapInfo.swapFee.number)} ${toToken.symbol}`
      );

      // const pairs = makePoolPairs(osmosisAssets, freefloat, prices); // see pairs data structure at file bottom
    };

    asd();
  }, []);

  // useEffect(() => {
  //   const testOsmo = async (): Promise<void> => {
  //     const { createRPCQueryClient } = osmosis.ClientFactory;

  //     const client = await createRPCQueryClient({
  //       rpcEndpoint: "https://rpc.osmosis.zone",
  //     });
  //     const asd = await client.osmosis.poolmanager.v1beta1.pool({
  //       poolId: BigInt(1),
  //     });
  //     const asd2 = await client.osmosis.poolmanager.v1beta1.pool({
  //       poolId: BigInt(1135),
  //     });
  //     const pools = [asd.pool, asd2.pool] as Pool[];
  //     console.log("Pools:", pools);

  //     const osmosisAssets = assets.filter((a) => a.chain_name === "osmosis");
  //     const cosmosAssets = assets.filter((a) => a.chain_name === "cosmoshub");
  //     // console.log("Assets:", assets, osmosisAssets, cosmosAssets);

  //     const prices = await fetchPrices(["cosmos", "osmosis"]);
  //     const hash1 = osmosisAssets[0].assets[0].base;
  //     const hash2 = cosmosAssets[0].assets[0].base;
  //     const prices2 = {
  //       [hash1]: prices["osmosis"],
  //       [hash2]: prices["cosmos"],
  //     };
  //     // const liq1 = calcPoolLiquidity(osmosisAssets, asd.pool as Pool, prices2);
  //     // const liq2 = calcPoolLiquidity(osmosisAssets, asd2.pool as Pool, prices2);
  //     const www = await client.osmosis.concentratedliquidity.v1beta1.pools({
  //       pagination: {
  //         limit: BigInt(5000),
  //         offset: BigInt(0),
  //         key: new Uint8Array(),
  //         countTotal: true,
  //         reverse: false,
  //       },
  //     });
  //     console.log("Pools:", www.pools);
  //     console.log("Prices:", prices2, prices);
  //     // console.log("Kappa:", kappa);
  //     // const routes = getRoutesForTrade({
  //     //   trade: {
  //     //     sell: {
  //     //       denom: tokenIn.denom,
  //     //       amount: tokenInAmount,
  //     //     },
  //     //     buy: {
  //     //       denom: tokenOut.denom,
  //     //       amount: tokenOutAmount,
  //     //     },
  //     //   },
  //     //   pairs,
  //     // });
  //   };

  //   testOsmo();
  // }, []);

  const account = useAtomValue(defaultAccountAtom);

  useEffect(() => {
    const handleOsmosisSwap = async (): Promise<void> => {
      invariant(account.data, "No transparent account is found");

      const transfer = {
        amountInBaseDenom: BigNumber(100),
        // osmosis channel
        channelId: "channel-13",
        portId: "transfer",
        token: "tnam1pkwymnfpkjprr59u9tpard62ser5dvm7ggfs7gxh",
        source: "tnam1qz4u7j7dkxj5wv9xuwy2qemaeeqd450ysgl7pq0r",
        receiver:
          "osmo1lrlqeq38ephw8mz0c3uzfdpt4fh3fr0s2atur5n33md90m4wx3mqmz7fq6",
      };
      const params = {
        transfer,
        outputDenom: "transfer/channel-14/uatom",
        recipient: "tnam1qz4u7j7dkxj5wv9xuwy2qemaeeqd450ysgl7pq0r",
        overflow: "tnam1qz4u7j7dkxj5wv9xuwy2qemaeeqd450ysgl7pq0r",
        slippage: { slippagePercentage: "20", windowSeconds: BigInt(60) },
        localRecoveryAddr: "osmo18st0wqx84av8y6xdlss9d6m2nepyqwj6n3q7js",
        osmosisRestRpc: "https://osmosis-rest.publicnode.com",
      };

      try {
        const encodedTxData = await performOsmosisSwap({
          signer: {
            publicKey: account.data.publicKey!,
            address: account.data.address!,
          },
          account: account.data,
          params: [params],
          gasConfig: {
            gasLimit: BigNumber(75000),
            gasPriceInMinDenom: BigNumber(0.000001),
            gasToken: "tnam1qy440ynh9fwrx8aewjvvmu38zxqgukgc259fzp6h",
          },
        });

        const signedTxs = await signTx(encodedTxData, account.data.address!);
        await broadcastTransaction(encodedTxData, signedTxs);
      } catch (error) {
        console.error("Error performing Osmosis swap:", error);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).osmosisSwap = handleOsmosisSwap;

    const handleOsmosisShieldedSwap = async (): Promise<void> => {
      invariant(account.data, "No transparent account is found");
      const a = account.data;

      let bparams: BparamsMsgValue[] | undefined;
      if (a.type === AccountType.Ledger) {
        const sdk = await getSdkInstance();
        const ledger = await sdk.initLedger();
        bparams = await ledger.getBparams();
        ledger.closeTransport();
      }

      const transfer = {
        amountInBaseDenom: BigNumber(100),
        // osmosis channel
        channelId: "channel-13",
        portId: "transfer",
        token: "tnam1pkxwqwhjkulpd2jmc5hmetj6hkfpf0cdfuzfx70c",
        source:
          "03d5935721000000803fe3d7a9c42c483e5c3840c13eb7dadec2e420f850a769342a2786b58c86215d1fd1ca29f99d94bf033533a30b3461a2dacc4d0f968a080a2a335a085525d18b29f5e59e281a297c35d62299ff82a1525ae327862aca92d01faceebe375af12530bf9eff49e6f90c2eb554db591b1fc30694c716635f0bd2050682d6eeb6a2c5438dd7725495fb866d76db12de4e44ad9be424af57d12c8c19a6dc8664825d8701000000000000000000000000000000000000000000000000000000000000000001f3d7b291d734e35aefd38601bc947778d3adefc9ee2defd8d745fe124e850d0b",
        gasSpendingKey:
          "03d5935721000000803fe3d7a9c42c483e5c3840c13eb7dadec2e420f850a769342a2786b58c86215d1fd1ca29f99d94bf033533a30b3461a2dacc4d0f968a080a2a335a085525d18b29f5e59e281a297c35d62299ff82a1525ae327862aca92d01faceebe375af12530bf9eff49e6f90c2eb554db591b1fc30694c716635f0bd2050682d6eeb6a2c5438dd7725495fb866d76db12de4e44ad9be424af57d12c8c19a6dc8664825d8701000000000000000000000000000000000000000000000000000000000000000001f3d7b291d734e35aefd38601bc947778d3adefc9ee2defd8d745fe124e850d0b",
        receiver:
          "osmo1lrlqeq38ephw8mz0c3uzfdpt4fh3fr0s2atur5n33md90m4wx3mqmz7fq6",
        bparams,
        refundTarget: "tnam1qqshvryx9pngpk7mmzpzkjkm6klelgusuvmkc0uz",
      };
      const params = {
        transfer,
        outputDenom: "transfer/channel-13/uosmo",
        recipient:
          "znam17k7jw0wmvzdzmfm46m8600t9cah5mjl6se75cu9jvwxywk75k3kmxehmxk7wha62l35puzl6srd",
        overflow: "tnam1qqshvryx9pngpk7mmzpzkjkm6klelgusuvmkc0uz",
        slippage: { 0: "1799" },
        localRecoveryAddr: "osmo18st0wqx84av8y6xdlss9d6m2nepyqwj6n3q7js",
        osmosisRestRpc: "https://osmosis-rest.publicnode.com",
      };

      try {
        const encodedTxData = await performOsmosisSwap({
          signer: {
            publicKey: account.data.publicKey!,
            address: account.data.address!,
          },
          account: account.data,
          params: [params],
          gasConfig: {
            gasLimit: BigNumber(75000),
            gasPriceInMinDenom: BigNumber(0.000001),
            gasToken: "tnam1qy440ynh9fwrx8aewjvvmu38zxqgukgc259fzp6h",
          },
        });

        const signedTxs = await signTx(encodedTxData, account.data.address!);
        await broadcastTransaction(encodedTxData, signedTxs);
      } catch (error) {
        console.error("Error performing Osmosis swap:", error);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).osmosisShieldedSwap = handleOsmosisShieldedSwap;
  }, [account.data]);

  return <></>;
};
