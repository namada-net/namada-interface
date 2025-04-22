import { defaultAccountAtom } from "atoms/accounts";
import { createOsmosisSwapTxAtom } from "atoms/transfer/atoms";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { useAtomValue } from "jotai";
import { broadcastTransaction, signTx } from "lib/query";
import { useEffect } from "react";

export const OsmosisSwap: React.FC = () => {
  const { mutateAsync: performOsmosisSwap } = useAtomValue(
    createOsmosisSwapTxAtom
  );

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
        // We want to receive TIA
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
  }, [account.data]);

  return <></>;
};
