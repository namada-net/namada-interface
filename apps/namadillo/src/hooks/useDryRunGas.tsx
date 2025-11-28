import { useDebounce } from "@namada/hooks";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { defaultAccountAtom } from "atoms/accounts";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { Atom, useAtomValue } from "jotai";
import { AtomWithMutationResult } from "jotai-tanstack-query";
import { dryRunTransaction, EncodedTxData } from "lib/query";
import { BuildTxAtomParams } from "types";
import { useTransactionFee } from "./useTransactionFee";

//TODO: reuse
type AtomType<T> = Atom<
  AtomWithMutationResult<
    EncodedTxData<T> | undefined,
    unknown,
    BuildTxAtomParams<T>,
    unknown
  >
>;

export const useDryRunGas = <T,>(
  createTxAtom: AtomType<T>,
  params: T[],
  publicKey: string
): UseQueryResult<bigint> => {
  const { mutateAsync: performBuildTx } = useAtomValue(createTxAtom);
  const { data: account } = useAtomValue(defaultAccountAtom);
  // TODO: we only do this to get gasToken
  const feeProps = useTransactionFee(["TransparentTransfer"], false);
  const gasConfig = { ...feeProps.gasConfig, gasLimit: BigNumber(500_000) }; // set high gas limit for dry run};
  const paramsDebounced = useDebounce(JSON.stringify(params), 1000);

  const transactionQuery = useQuery({
    queryKey: ["dry-run-gas", gasConfig.gasToken, paramsDebounced],
    enabled: params.length > 0,
    queryFn: async () => {
      invariant(account, "Default account is not set");
      const variables = {
        params,
        gasConfig,
        account,
        //TODO: do we need additionalParams for gas?
        // ...txAdditionalParams,
      };

      const encodedTxData = await performBuildTx(variables);
      const txsBytes = encodedTxData?.txs.map((tx) => tx.bytes);
      const gas = await dryRunTransaction(txsBytes!, publicKey);

      return gas;
    },
  });

  return transactionQuery;
};
