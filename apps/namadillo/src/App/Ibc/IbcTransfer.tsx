import { TransferModule } from "App/Transfer/TransferModule";
import { SUPPORTED_ASSETS_MAP } from "atoms/integrations";
import { KeplrWalletManager } from "integrations/Keplr";

const keplr = new KeplrWalletManager();
const defaultChainId = "cosmoshub-4";

export const IbcTransfer = (): JSX.Element => {
  // const navigate = useNavigate();
  // const [completedAt, setCompletedAt] = useState<Date | undefined>();

  // const availableChains = useMemo(getAvailableChains, []);

  // // Global & Atom states
  // const defaultAccounts = useAtomValue(allDefaultAccountsAtom);

  // // Wallet & Registry
  // const {
  //   registry,
  //   walletAddress: sourceAddress,
  //   connectToChainId,
  // } = useWalletManager(keplr);
  // const namadaChainRegistry = useAtomValue(namadaChainRegistryAtom);
  // const chainRegistry = namadaChainRegistry.data;

  // // IBC Channels & Balances
  // const {
  //   data: ibcChannels,
  //   isError: unknownIbcChannels,
  //   isLoading: isLoadingIbcChannels,
  // } = useAtomValue(ibcChannelsFamily(registry?.chain.chain_name));

  // const { data: userAssets, isLoading: isLoadingBalances } = useAtomValue(
  //   assetBalanceAtomFamily({
  //     chain: registry?.chain,
  //     walletAddress: sourceAddress,
  //   })
  // );

  // const { trackEvent } = useFathomTracker();
  // const [shielded, setShielded] = useState<boolean>(true);
  // const [selectedAssetBase, setSelectedAssetBase] = useUrlState(params.asset);
  // const [amount, setAmount] = useState<BigNumber | undefined>();
  // const [generalErrorMessage, setGeneralErrorMessage] = useState("");
  // const [sourceChannel, setSourceChannel] = useState("");
  // const [destinationChannel, setDestinationChannel] = useState("");
  // const [currentStatus, setCurrentStatus] = useState<string>();
  // const [txHash, setTxHash] = useState<string | undefined>();

  // const availableDisplayAmount = mapUndefined((baseDenom) => {
  //   return userAssets ? userAssets[baseDenom]?.amount : undefined;
  // }, selectedAssetBase);

  // const selectedAsset =
  //   selectedAssetBase ? userAssets?.[selectedAssetBase]?.asset : undefined;

  const availableAssets = useMemo(() => {
    if (!userAssets || !registry) return undefined;

    //     Object.entries(userAssets).forEach(([key, { asset }]) => {
    //       const namadaAsset = getNamadaAssetByIbcAsset(
    //         asset,
    //         chainRegistry?.assets.assets ?? []
    //       );

    Object.entries(userAssets).forEach(([key, { asset }]) => {
      if (
        SUPPORTED_ASSETS_MAP.get(registry.chain.chain_name)?.includes(
          asset.symbol
        )
      ) {
        output[key] = { ...userAssets[key] };
      }
    });

    return output;
  }, [Object.keys(userAssets || {}).join(""), registry?.chain.chain_name]);

  // // Set source and destination channels based on IBC channels data
  // useEffect(() => {
  //   setSourceChannel(ibcChannels?.ibcChannel || "");
  //   setDestinationChannel(ibcChannels?.namadaChannel || "");
  // }, [ibcChannels]);

  // useTransactionEventListener("IbcTransfer.Success", (e) => {
  //   if (txHash && e.detail.hash === txHash) {
  //     setCompletedAt(new Date());
  //     trackEvent(
  //       `${shielded ? "Shielded " : ""}IbcTransfer: tx complete (${e.detail.asset.symbol})`
  //     );
  //   }
  // });

  // useTransactionEventListener("IbcTransfer.Error", (e) => {
  //   trackEvent(
  //     `${shielded ? "Shielded " : ""}IbcTransfer: tx error (${e.detail.asset.symbol})`
  //   );
  // });

  // const onSubmitTransfer = async ({
  //   displayAmount,
  //   destinationAddress,
  //   memo,
  // }: OnSubmitTransferParams): Promise<void> => {
  //   try {
  //     invariant(registry?.chain, "Error: Chain not selected");
  //     setGeneralErrorMessage("");
  //     setCurrentStatus("Submitting...");
  //     const result = await transferToNamada.mutateAsync({
  //       destinationAddress,
  //       displayAmount,
  //       memo,
  //       onUpdateStatus: setCurrentStatus,
  //     });
  //     storeTransaction(result);
  //     setTxHash(result.hash);
  //     trackEvent(
  //       `${shielded ? "Shielded " : ""}IbcTransfer: tx submitted (${result.asset.symbol})`
  //     );
  //   } catch (err) {
  //     setGeneralErrorMessage(err + "");
  //     setCurrentStatus(undefined);
  //   }
  // };

  // const onChangeWallet = (): void => {
  //   if (registry) {
  //     connectToChainId(registry.chain.chain_id);
  //     return;
  //   }
  //   connectToChainId(defaultChainId);
  // };

  return (
    <div className="relative min-h-[600px]">
      <header className="flex flex-col items-center text-center mb-8 gap-6">
        {/* <IbcTopHeader type="ibcToNam" isShielded={shielded} /> */}
      </header>
      {/* <div className="mb-6">{!completedAt && <IbcTabNavigation />}</div> */}
      <TransferModule />
    </div>
  );
};
