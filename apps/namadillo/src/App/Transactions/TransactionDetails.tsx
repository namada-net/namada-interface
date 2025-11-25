import { Panel } from "@namada/components";
import { useSanitizedParams } from "@namada/hooks";
import { TransactionReceipt } from "App/Common/TransactionReceipt";
import { useTransactionActions } from "hooks/useTransactionActions";
import { TransactionNotFoundPanel } from "./TransactionNotFoundPanel";

export const TransactionDetails = (): JSX.Element => {
  const { hash } = useSanitizedParams();
  const { findByHash } = useTransactionActions();

  const transaction = findByHash(hash || "");
  if (!transaction) {
    return <TransactionNotFoundPanel hash={hash || ""} />;
  }

  return (
    <Panel className="flex-1 h-full">
      <TransactionReceipt transaction={transaction} />
    </Panel>
  );
};
