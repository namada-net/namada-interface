import { coin } from "@cosmjs/proto-signing";
import {
  Attribute,
  DeliverTxResponse,
  MsgTransferEncodeObject,
} from "@cosmjs/stargate";
import namada from "@namada/chains/chains/namada";
import {
  ShieldedTransferProps,
  ShieldingTransferProps,
  TransparentTransferProps,
  UnshieldingTransferProps,
} from "@namada/sdk-multicore";
import BigNumber from "bignumber.js";
import {
  Asset,
  IbcTransferTransactionData,
  TransferStep,
  TransferTransactionData,
} from "types";
import { toDisplayAmount } from "utils";

import {
  allTransferStages,
  AllTransferTxKind,
  IbcTransferStage,
  NamadaTransferTxKind,
} from "types";
import { isNamadaAsset } from "utils";
import { TransactionPair } from "./query";

export const getEventAttribute = (
  tx: DeliverTxResponse,
  attributeType: string
): Record<string, string> => {
  const attributes: readonly Attribute[] =
    tx.events.find((event) => event.type === attributeType)?.attributes || [];
  return attributes.reduce(
    (obj, current) => {
      return {
        ...obj,
        [current.key]: current.value,
      };
    },
    {} as Record<string, string>
  );
};

const getTxNextStep = (
  txKind: AllTransferTxKind,
  currentStep: TransferStep
): TransferStep => {
  const stages = allTransferStages[txKind];
  const stepIdx = stages.findIndex((el) => el === currentStep);
  return stages[Math.min(stepIdx + 1, stages.length - 1)];
};

const getAttributeValue = (
  attributeMap: Record<string, string>,
  key: string
): string => {
  if (key in attributeMap) {
    return attributeMap[key];
  }
  return "";
};

const getNumberAttributeValue = (
  attributeMap: Record<string, string>,
  key: string
): BigNumber => {
  const value = getAttributeValue(attributeMap, key);
  return new BigNumber(value || 0);
};

const getAmountAttributeValue = (
  attributeMap: Record<string, string>,
  key: string,
  denom: string
): BigNumber => {
  const value = getAttributeValue(attributeMap, key);
  return new BigNumber(value.replace(denom, "") || 0);
};

export const createIbcTransferMessage = (
  sourceChannelId: string,
  sourceAddress: string,
  receiverAddress: string,
  amount: BigNumber,
  token: string,
  memo?: string
): MsgTransferEncodeObject => {
  const timeoutTimestampNanoseconds =
    BigInt(Math.floor(Date.now() / 1000) + 60) * BigInt(1_000_000_000);
  return {
    typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
    value: {
      sourcePort: "transfer",
      sourceChannel: sourceChannelId,
      sender: sourceAddress,
      receiver: receiverAddress,
      token: coin(amount.toString(), token),
      timeoutHeight: undefined,
      timeoutTimestamp: timeoutTimestampNanoseconds,
      memo,
    },
  };
};

const getIbcTransferAttributes = (
  tx: DeliverTxResponse
): Record<string, string> => {
  const transferAttributes = getEventAttribute(tx, "ibc_transfer");
  if ("amount" in transferAttributes) {
    return transferAttributes;
  }

  // Fallback to send_packet event if ibc_transfer doesn't contain amount
  const sendPackageAttributes = getEventAttribute(tx, "send_packet");
  if ("packet_data" in sendPackageAttributes) {
    const packetData = JSON.parse(sendPackageAttributes.packet_data);
    return {
      ...transferAttributes,
      amount: packetData.amount || "",
      receiver: packetData.receiver || "",
      sender: packetData.sender || "",
    };
  }

  throw new Error(
    "Unable to find the correct amount value in the IBC transaction"
  );
};

export const createTransferDataFromIbc = (
  tx: DeliverTxResponse,
  rpc: string,
  asset: Asset,
  sourceChainId: string,
  destinationChainId: string,
  details: IbcTransferStage,
  isShieldedTx: boolean
): TransferTransactionData => {
  const transferAttributes = getIbcTransferAttributes(tx);
  const packetAttributes = getEventAttribute(tx, "send_packet");
  const feeAttributes = getEventAttribute(tx, "fee_pay");
  const tipAttributes = getEventAttribute(tx, "tip_pay");
  const baseDenom = asset.base;

  const transferAmount = toDisplayAmount(
    asset,
    getAmountAttributeValue(transferAttributes, "amount", baseDenom)
  );

  const tipPaid = toDisplayAmount(
    asset,
    getAmountAttributeValue(tipAttributes, "tip", baseDenom)
  );

  const feePaid = toDisplayAmount(
    asset,
    getAmountAttributeValue(feeAttributes, "fee", baseDenom)
  );

  const transferTx: IbcTransferTransactionData = {
    ...details,
    hash: tx.transactionHash,
    // For IBC transfers(deposits), the innerHash is the same as the transaction hash
    innerHash: tx.transactionHash,
    rpc,
    asset,
    feePaid,
    tipPaid,
    displayAmount: transferAmount,
    status: "pending",
    sourcePort: "transfer",
    chainId: sourceChainId,
    shielded: isShieldedTx,
    currentStep: TransferStep.WaitingConfirmation,
    destinationChainId: destinationChainId ?? namada.chainId,
    sourceAddress: getAttributeValue(transferAttributes, "sender"),
    destinationAddress: getAttributeValue(transferAttributes, "receiver"),
    sequence: getNumberAttributeValue(packetAttributes, "packet_sequence"),
    sourceChannel: getAttributeValue(packetAttributes, "packet_src_channel"),
    destinationChannel: getAttributeValue(
      packetAttributes,
      "packet_dst_channel"
    ),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return transferTx;
};

export const createTransferDataFromNamada = (
  txKind: NamadaTransferTxKind,
  asset: Asset,
  rpcUrl: string,
  isShieldedTx: boolean,
  txResponse?:
    | TransactionPair<TransparentTransferProps>
    | TransactionPair<ShieldedTransferProps>
    | TransactionPair<ShieldingTransferProps>
    | TransactionPair<UnshieldingTransferProps>,
  memo?: string
): TransferTransactionData[] => {
  if (!txResponse?.encodedTxData?.txs?.length) {
    throw "Invalid transaction response";
  }

  const propsList = txResponse.encodedTxData.meta?.props;
  if (!propsList || propsList.length === 0) {
    throw "Invalid transaction props";
  }

  return propsList
    .map((wrapperProps) => {
      return wrapperProps.data.map((innerProps) => {
        const sourceAddress =
          "source" in wrapperProps ? wrapperProps.source
          : "source" in innerProps ? innerProps.source
          : "";

        const destinationAddress =
          "target" in wrapperProps ? wrapperProps.target
          : "target" in innerProps ? innerProps.target
          : "";

        const baseAmount =
          "amount" in innerProps ? innerProps.amount : new BigNumber(0);

        const displayAmount =
          isNamadaAsset(asset) ? baseAmount : (
            toDisplayAmount(asset, baseAmount)
          );

        return {
          type: txKind,
          currentStep: getTxNextStep(txKind, TransferStep.Sign),
          sourceAddress,
          destinationAddress,
          asset,
          memo,
          rpc: rpcUrl,
          shielded: isShieldedTx,
          displayAmount,
          chainId: txResponse?.encodedTxData.txs[0]?.args.chainId ?? "",
          hash: txResponse?.encodedTxData.txs[0].hash,
          feePaid: txResponse?.encodedTxData.txs[0].args.feeAmount,
          resultTxHash: txResponse?.encodedTxData.txs[0].hash,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as TransferTransactionData;
      });
    })
    .flat();
};
