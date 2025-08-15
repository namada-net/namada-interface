import { Sdk } from "@namada/sdk-multicore";
import { QueryStatus, useQuery } from "@tanstack/react-query";
import { PageLoader } from "App/Common/PageLoader";
import { chainParametersAtom, nativeTokenAddressAtom } from "atoms/chain";
import { useAtomValue } from "jotai";
import {
  createContext,
  FunctionComponent,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { getSdkInstance } from "utils/sdk";

type SdkContext = {
  sdk?: Sdk;
  maspParamsStatus: QueryStatus;
};

export const SdkContext = createContext<SdkContext>({
  sdk: undefined,
  maspParamsStatus: "pending",
});

const paramsUrl = "/params/";

export const SdkProvider: FunctionComponent<PropsWithChildren> = ({
  children,
}) => {
  const [sdk, setSdk] = useState<Sdk>();
  const nativeToken = useAtomValue(nativeTokenAddressAtom);
  const parameters = useAtomValue(chainParametersAtom);

  // fetchAndStoreMaspParams() returns nothing,
  // so we return boolean on success for the query to succeed:
  const fetchMaspParams = async (chainId: string): Promise<boolean | void> => {
    const { masp } = sdk!;

    return masp.hasMaspParams().then(async (hasMaspParams) => {
      if (hasMaspParams) {
        await masp.loadMaspParams("", chainId).catch((e) => Promise.reject(e));
        return true;
      }
      return masp
        .fetchAndStoreMaspParams(paramsUrl)
        .then(() => masp.loadMaspParams("", chainId).then(() => true))
        .catch((e) => {
          throw new Error(e);
        });
    });
  };

  const { status: maspParamsStatus } = useQuery({
    queryKey: ["sdk"],
    enabled: Boolean(parameters.data),
    queryFn: async () => await fetchMaspParams(parameters.data!.chainId),
    retry: 3,
    retryDelay: 3000,
  });

  useEffect(() => {
    if (nativeToken.data) {
      getSdkInstance().then((sdk) => {
        setSdk(sdk);
      });
    }
  }, [nativeToken.data]);

  if (!sdk) {
    return <PageLoader />;
  }

  return (
    <>
      <SdkContext.Provider value={{ sdk, maspParamsStatus }}>
        {children}
      </SdkContext.Provider>
    </>
  );
};

export const useSdk = (): SdkContext => {
  return useContext(SdkContext);
};
