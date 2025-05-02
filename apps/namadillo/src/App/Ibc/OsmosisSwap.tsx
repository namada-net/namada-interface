import { Asset } from "@chain-registry/types";
import { Stack } from "@namada/components";
import { IbcToken } from "@namada/indexer-client";
import { AccountType, BparamsMsgValue } from "@namada/types";
import { allDefaultAccountsAtom } from "atoms/accounts";
import { namadaShieldedAssetsAtom } from "atoms/balance";
import { chainTokensAtom, osmosisSymbolAssetMapAtom } from "atoms/chain";
import { ibcChannelsFamily } from "atoms/integrations";
import { SwapResponse, SwapResponseError, SwapResponseOk } from "atoms/swaps";
import { createOsmosisSwapTxAtom } from "atoms/transfer/atoms";
import BigNumber from "bignumber.js";
import { useTransactionFee } from "hooks/useTransactionFee";
import invariant from "invariant";
import { useAtomValue } from "jotai";
import { broadcastTransaction, signTx } from "lib/query";
import { useCallback, useEffect, useState } from "react";
import { AddressWithAssetAndAmount } from "types";
import { getSdkInstance } from "utils/sdk";

const SUPPORTED_TOKENS_SYMBOLS = ["OSMO", "ATOM", "TIA"] as const;
const SLIPPAGE = 0.005;
const SWAP_CONTRACT_ADDRESS =
  "osmo1lrlqeq38ephw8mz0c3uzfdpt4fh3fr0s2atur5n33md90m4wx3mqmz7fq6";

export const OsmosisSwap: React.FC = () => {
  // TODO: need to figure out those maps
  const osmosisSymbolAssetsMap = useAtomValue(osmosisSymbolAssetMapAtom);
  const chainTokens = useAtomValue(chainTokensAtom);

  const { mutateAsync: performOsmosisSwap } = useAtomValue(
    createOsmosisSwapTxAtom
  );
  const { data: availableAssets, isLoading: _isLoadingAssets } = useAtomValue(
    namadaShieldedAssetsAtom
  );

  const supportedAssets: [Asset, AddressWithAssetAndAmount | undefined][] =
    SUPPORTED_TOKENS_SYMBOLS.map(
      // TODO: we should not use availableAssets here
      (s) => [
        osmosisSymbolAssetsMap[s],
        Object.values(availableAssets || {}).find((a) => a.asset.symbol === s),
      ]
    );

  const [from, setFrom] = useState<AddressWithAssetAndAmount | undefined>();
  const [to, setTo] = useState<
    [Asset, AddressWithAssetAndAmount | undefined] | undefined
  >();
  const [amount, setAmount] = useState<string>("");
  const [recipient, setRecipient] = useState<string>(
    "znam17k7jw0wmvzdzmfm46m8600t9cah5mjl6se75cu9jvwxywk75k3kmxehmxk7wha62l35puzl6srd"
  );
  const [localRecoveryAddr, setLocalRecoveryAddress] = useState<string>(
    "osmo18st0wqx84av8y6xdlss9d6m2nepyqwj6n3q7js"
  );
  const [quote, setQuote] = useState<
    (SwapResponseOk & { minAmount: string }) | null
  >(null);

  // TODO:  we should get this from the namada assets
  const toTrace = (
    chainTokens?.data?.find(
      (t) => t.address === to?.[1]?.originalAddress
    ) as IbcToken
  )?.trace;

  const { data: ibcChannels } = useAtomValue(ibcChannelsFamily("osmosis"));

  const feeProps = useTransactionFee(["IbcTransfer"], true);

  useEffect(() => {
    const call = async (): Promise<void> => {
      const quote = await fetch(
        "https://sqs.osmosis.zone/router/quote?" +
          new URLSearchParams({
            tokenIn: `${amount}${from!.asset.base}`,
            tokenOutDenom: to![0].base,
            humanDenoms: "false",
          }).toString()
      );
      const response: SwapResponse = await quote.json();

      if (!(response as SwapResponseError).message) {
        const r = response as SwapResponseOk;
        const minAmount = BigNumber(r.amount_out)
          .times(BigNumber(1).minus(SLIPPAGE))
          .toString();
        setQuote({ ...(response as SwapResponseOk), minAmount });
      } else {
        setQuote(null);
      }
    };
    if (from && to && amount) {
      call();
    }
  }, [from?.originalAddress, to?.[1]?.originalAddress, amount]);

  const defaultAccounts = useAtomValue(allDefaultAccountsAtom);
  const shieldedAccount = defaultAccounts.data?.find(
    (account) => account.type === AccountType.ShieldedKeys
  );
  const transparentAccount = defaultAccounts.data?.find(
    (account) => account.type !== AccountType.ShieldedKeys
  );

  const handleOsmosisSwap = useCallback(async () => {
    invariant(transparentAccount, "No transparent account is found");
    invariant(shieldedAccount, "No shielded account is found");
    invariant(from, "No from asset");
    invariant(ibcChannels, "No ibc channels");
    invariant(quote, "No quote");
    invariant(localRecoveryAddr, "No local recovery address");
    invariant(recipient, "No recipient");

    let bparams: BparamsMsgValue[] | undefined;
    if (transparentAccount.type === AccountType.Ledger) {
      const sdk = await getSdkInstance();
      const ledger = await sdk.initLedger();
      bparams = await ledger.getBparams();
      ledger.closeTransport();
    }

    const transfer = {
      amountInBaseDenom: BigNumber(amount),
      // osmosis channel
      channelId: "channel-13",
      portId: "transfer",
      token: from.originalAddress,
      source: shieldedAccount.pseudoExtendedKey!,
      gasSpendingKey: shieldedAccount.pseudoExtendedKey!,
      receiver: SWAP_CONTRACT_ADDRESS,
      bparams,
      // TODO: replace with disposable signer
      refundTarget: transparentAccount.address,
    };
    const params = {
      transfer,
      outputDenom: toTrace,
      recipient,
      // TODO: this should also be disposable address most likely
      overflow: transparentAccount.address,
      slippage: {
        0: BigNumber(quote.minAmount)
          .integerValue(BigNumber.ROUND_DOWN)
          .toString(),
      },
      localRecoveryAddr,
      // TODO: not sure if hardcoding is ok, maybe we should connect keplr wallet
      osmosisRestRpc: "https://osmosis-rest.publicnode.com",
    };

    try {
      const encodedTxData = await performOsmosisSwap({
        signer: {
          // TODO: use disposable signer
          publicKey: transparentAccount.publicKey!,
          address: transparentAccount.address!,
        },
        account: transparentAccount,
        params: [params],
        gasConfig: feeProps.gasConfig,
      });

      // TODO: use disposable signer
      const signedTxs = await signTx(
        encodedTxData,
        transparentAccount.address!
      );
      await broadcastTransaction(encodedTxData, signedTxs);
      alert("Transaction sent 🚀");
    } catch (error) {
      console.error("Error performing Osmosis swap:", error);
      alert("Transaction errror 🪦");
    }
  }, [transparentAccount, shieldedAccount, toTrace, quote]);

  return (
    <div className="text-white">
      <div>From:</div>
      <Stack direction="horizontal">
        <select
          className="text-black"
          onChange={(e) => setFrom(availableAssets?.[e.target.value])}
        >
          <option value=""></option>
          {Object.values(availableAssets || {}).map((al) => (
            <option key={al.asset.base} value={al.originalAddress}>
              {al.asset.symbol}
            </option>
          ))}
        </select>
        <div>{from?.amount?.toString()}</div>
      </Stack>
      <div>To:</div>
      <select
        className="text-black"
        onChange={(e) =>
          // TODO: this sucks because avaialbleAssets only shows tokens that we can use,
          // we need to change registry to get all supported tokens
          setTo(supportedAssets[Number(e.target.value)])
        }
      >
        <option value=""></option>
        {supportedAssets.map(([asset], i) => (
          <option key={asset.base} value={i}>
            {asset.symbol}
          </option>
        ))}
      </select>
      <div>Amount in base denom:</div>
      <input
        className="text-black"
        type="text"
        onChange={(e) => setAmount(e.target.value)}
      />
      <div>Recipient(znam address):</div>
      <input
        className="text-black"
        type="text"
        onChange={(e) => setRecipient(e.target.value)}
        value={recipient}
      />
      <div>
        Local recovery address(osmosis address to send tokens to in case
        something goes wrong on osmisis)
      </div>
      <input
        className="text-black"
        type="text"
        onChange={(e) => setLocalRecoveryAddress(e.target.value)}
        value={localRecoveryAddr}
      />
      <br />
      <button
        className="bg-yellow text-black p-4 m-3"
        onClick={handleOsmosisSwap}
      >
        SWAP🎏
      </button>

      <p>---</p>
      <div> Receive: </div>
      {quote && (
        <div>
          <div>
            Amount in: {quote.amount_in.amount}
            {from?.asset.denom_units[0].aliases?.[0]}
          </div>
          <div>
            Amount out: {quote.amount_out}
            {to?.[1]?.asset.denom_units[0].aliases?.[0]}
          </div>
          <div>
            Min amount out: {quote.minAmount}
            {to?.[1]?.asset.denom_units[0].aliases?.[0]}
          </div>
          <div>Slippage: {SLIPPAGE * 100}%</div>
          <div>Routes: </div>
          <div>Effective fee: {BigNumber(quote.effective_fee).toString()}</div>
          <div>
            Price: 1 {from?.asset.symbol} ≈{" "}
            {BigNumber(quote.amount_out).div(BigNumber(amount)).toString()}{" "}
            {to?.[1]?.asset.symbol}
          </div>
          <div>
            Price impact: {BigNumber(quote.price_impact).dp(3).toString()}
          </div>
          <ul className="list-disc list-inside">
            {quote.route.map((r, i) => (
              <li key={i}>
                Route{i + 1}
                <ul className="list-disc list-inside pl-4">
                  {r.pools.map((p, i) => (
                    <li key={i}>
                      {p.id}: {p.token_out_denom}
                      (Fee: {BigNumber(p.taker_fee).toString()})
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
