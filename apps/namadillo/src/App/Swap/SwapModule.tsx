import { Panel } from "@namada/components";
import { useAtomValue } from "jotai";
import { Link } from "react-router-dom";
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
    <Panel className="relative rounded-sm flex flex-col flex-1 pt-9">
      {!["Broadcasting", "Confirming", "Completed"].includes(status.t) && (
        <SwapHeader />
      )}

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
          <p className="w-full mt-6 text-center font-light hover:text-purple-500 transition-colors">
            <Link
              to="https://osmosis.zone"
              target="_blank"
              rel="noreferrer nofollow"
            >
              Powered by Osmosis
            </Link>
          </p>
        )}
      </section>
    </Panel>
  );
};
