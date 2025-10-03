import { useAtom } from "jotai";
import { SwapStatus } from "./state";
import { swapStatusAtom } from "./state/atoms";
import { SwapCalculations } from "./SwapCalculations";
import { SwapHeader } from "./SwapHeader";
import { SwapInProgress } from "./SwapInProgress";
import { SwapReview } from "./SwapReview";
import { SwapSuccess } from "./SwapSuccess";

export const SwapModule = (): JSX.Element => {
  // Feature state
  const [status, setStatus] = useAtom(swapStatusAtom);

  return (
    <>
      {![
        SwapStatus.Broadcasting,
        SwapStatus.Confirming,
        SwapStatus.Completed,
        SwapStatus.Error,
      ].includes(status) && <SwapHeader />}

      <section className="w-full max-w-[480px] mx-auto" role="widget">
        {status === SwapStatus.Idle && <SwapCalculations />}
        {[SwapStatus.Review].includes(status) && <SwapReview />}

        {[SwapStatus.Confirming, SwapStatus.Broadcasting].includes(status) && (
          <SwapInProgress />
        )}
        {status === SwapStatus.Completed && <SwapSuccess />}

        {![
          SwapStatus.Broadcasting,
          SwapStatus.Confirming,
          SwapStatus.Completed,
          SwapStatus.Error,
        ].includes(status) && (
          <p className="w-full mt-6 text-center font-light">
            Powered by Osmosis
          </p>
        )}
      </section>
    </>
  );
};
