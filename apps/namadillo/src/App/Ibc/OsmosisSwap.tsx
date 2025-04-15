import { defaultAccountAtom } from "atoms/accounts";
import { createOsmosisSwapTxAtom } from "atoms/transfer/atoms";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { useAtomValue } from "jotai";
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
        amountInBaseDenom: BigNumber(10),
        // osmosis channel
        channelId: "channel-7",
        portId: "transfer",
        token: "tnam1p4zuqqd94csj6zv8n0jxylz9kex4vdsgvg3uglw9",
        source:
          "03d5935721000000803fe3d7a9c42c483e5c3840c13eb7dadec2e420f850a769342a2786b58c86215d1fd1ca29f99d94bf033533a30b3461a2dacc4d0f968a080a2a335a085525d18b29f5e59e281a297c35d62299ff82a1525ae327862aca92d01faceebe375af12530bf9eff49e6f90c2eb554db591b1fc30694c716635f0bd2050682d6eeb6a2c5438dd7725495fb866d76db12de4e44ad9be424af57d12c8c19a6dc8664825d8701000000000000000000000000000000000000000000000000000000000000000001f3d7b291d734e35aefd38601bc947778d3adefc9ee2defd8d745fe124e850d0b",
        receiver:
          "osmo1ewll8h7up3g0ca2z9ur9e6dv6an64snxg5k8tmzylg6uprkyhgzszjgdzr",
        gasSpendingKey:
          "03d5935721000000803fe3d7a9c42c483e5c3840c13eb7dadec2e420f850a769342a2786b58c86215d1fd1ca29f99d94bf033533a30b3461a2dacc4d0f968a080a2a335a085525d18b29f5e59e281a297c35d62299ff82a1525ae327862aca92d01faceebe375af12530bf9eff49e6f90c2eb554db591b1fc30694c716635f0bd2050682d6eeb6a2c5438dd7725495fb866d76db12de4e44ad9be424af57d12c8c19a6dc8664825d8701000000000000000000000000000000000000000000000000000000000000000001f3d7b291d734e35aefd38601bc947778d3adefc9ee2defd8d745fe124e850d0b",
        refundTarget: "tnam1qz24lx0mz3y9uahfkxvnurnynqe898actvzyy22y",
      };
      const params = {
        transfer,
        // We want to receive TIA
        outputDenom: "transfer/channel-10/utia",
        recipient: "tnam1qqshvryx9pngpk7mmzpzkjkm6klelgusuvmkc0uz",
        overflow: "tnam1qqshvryx9pngpk7mmzpzkjkm6klelgusuvmkc0uz",
        slippage: { 0: "1" },
        localRecoveryAddr: "osmo1sy99khct7t7wth2wus5xpwkcf6n8p0lvrnwelh",
        route: [
          {
            poolId: "1464",
            tokenOutDenom:
              "ibc/498A0751C798A0D9A389AA3691123DADA57DAA4FE165D5C75894505B876BA6E4",
          },
          {
            poolId: "1247",
            tokenOutDenom:
              "ibc/D79E7D83AB399BFFF93433E54FAA480C191248FC556924A2A8351AE2638B3877",
          },
        ],
        osmosisRestRpc: "https://osmosis-rest.publicnode.com",
      };

      try {
        await performOsmosisSwap({
          signer: {
            publicKey: account.data.publicKey!,
            address: account.data.address!,
          },
          account: account.data,
          params: [params],
          gasConfig: {
            gasLimit: BigNumber(75000),
            gasPriceInMinDenom: BigNumber(0.000001),
            gasToken: "tnam1p4zuqqd94csj6zv8n0jxylz9kex4vdsgvg3uglw9",
          },
        });
      } catch (error) {
        console.error("Error performing Osmosis swap:", error);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).osmosisSwap = handleOsmosisSwap;
  }, [account.data]);

  return <></>;
};
