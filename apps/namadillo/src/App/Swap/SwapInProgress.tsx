import { Heading, Stack } from "@namada/components";
import anime from "animejs";
import { clearDisposableSigner } from "atoms/transfer/services";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { OsmosisSwapTransactionData } from "types";
import { useTransactionEventListener } from "utils";
import swapInProgressImg from "../Masp/assets/swap-in-progress.png";
import { swapStatusAtom } from "./state/atoms";

export const SwapInProgress = (): JSX.Element => {
  const [status, setStatus] = useAtom(swapStatusAtom);
  const imageContainerRef = useRef<HTMLImageElement | null>(null);
  const headerRef = useRef<HTMLHeadingElement | null>(null);

  useTransactionEventListener(["ShieldedOsmosisSwap.Success"], async (e) => {
    const tx = e.detail as OsmosisSwapTransactionData;
    if (
      status.t === "Confirming" &&
      status.txHash &&
      tx.hash === status.txHash
    ) {
      // TODO: Handle this elswhere, because if we change view before the disposable
      // signer won't be cleared
      await clearDisposableSigner(tx.refundTarget);
      setStatus({ t: "Completed" });
    }
  });

  useTransactionEventListener(["ShieldedOsmosisSwap.Error"], async (e) => {
    if (
      status.t === "Confirming" &&
      status.txHash &&
      e.detail.hash === status.txHash
    ) {
      setStatus({
        t: "Error",
        message: e.detail.errorMessage || "Transaction failed",
      });
    }
  });

  useEffect(() => {
    if (!imageContainerRef.current || !headerRef.current) return;

    const image = imageContainerRef.current.children[0] as HTMLImageElement;
    const header = headerRef.current.children[0] as HTMLHeadingElement;

    const timelineOpacity = anime.timeline({
      easing: "easeOutExpo",
    });
    const timelineRotation = anime.timeline({
      easing: "easeInOutCirc",
      loop: true,
    });

    timelineOpacity.add({
      targets: [image, header],
      opacity: [0, 1],
      duration: 1000,
      easing: "easeOutBack",
    });

    timelineRotation.add(
      {
        targets: [image],
        rotate: {
          value: "-=180",
          duration: 600,
        },
      },
      "+=1000"
    );

    timelineRotation.add(
      {
        targets: [image],
        rotate: {
          value: "-=180",
          duration: 600,
        },
      },
      "+=1000"
    );
  }, []);

  return (
    <Stack className="mt-[150px]">
      <div ref={headerRef}>
        <Heading className="text-center text-2xl font-normal text-yellow">
          Shielded swap in
          <br />
          progress
        </Heading>
      </div>
      <div ref={imageContainerRef} className="flex items-center justify-center">
        <img className="max-w-[280px]" src={swapInProgressImg} alt="" />
      </div>
    </Stack>
  );
};
