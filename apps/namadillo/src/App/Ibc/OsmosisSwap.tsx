import { AccountType, BparamsMsgValue } from "@namada/types";
import { defaultAccountAtom } from "atoms/accounts";
import { createOsmosisSwapTxAtom } from "atoms/transfer/atoms";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { useAtomValue } from "jotai";
import { broadcastTransaction, signTx } from "lib/query";
import { useEffect } from "react";
import { getSdkInstance } from "utils/sdk";

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
