import { useAtomValue } from "jotai";
import { swapStatusAtom } from "./state/atoms";
import { SwapCalculations } from "./SwapCalculations";
import { SwapHeader } from "./SwapHeader";
import { SwapInProgress } from "./SwapInProgress";
import { SwapReview } from "./SwapReview";
import { SwapSuccess } from "./SwapSuccess";

// TODO: for better state isolation, we should create a new store for the swap module
// and pass the shared state(accounts, fees, etc.) as props to the module components
export const SwapModule = (): JSX.Element => {
  const status = useAtomValue(swapStatusAtom);

  return (
    <>
      {!["Broadcasting", "Confirming", "Completed", "Error"].includes(
        status.t
      ) && <SwapHeader />}

      <section className="w-full max-w-[480px] mx-auto" role="widget">
        {status.t === "Idle" && <SwapCalculations />}
        {["Review", "Building", "AwaitingSignature", "Error"].includes(
          status.t
        ) && <SwapReview />}

        {["Confirming", "Broadcasting"].includes(status.t) && (
          <SwapInProgress />
        )}
        {status.t === "Completed" && <SwapSuccess />}

        {!["Broadcasting", "Confirming", "Completed", "Error"].includes(
          status.t
        ) && (
          <p className="w-full mt-6 text-center font-light">
            Powered by Osmosis
          </p>
        )}
      </section>
    </>
  );
};
