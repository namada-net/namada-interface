import { Heading, Stack } from "@namada/components";
import anime from "animejs";
import { useEffect, useRef } from "react";
import swapInProgressImg from "../Masp/assets/swap-in-progress.png";

export const SwapInProgress = (): JSX.Element => {
  const imageContainerRef = useRef<HTMLImageElement | null>(null);
  const headerRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (!imageContainerRef.current || !headerRef.current) return;

    const image = imageContainerRef.current.children[0] as HTMLImageElement;
    const header = headerRef.current.children[0] as HTMLHeadingElement;

    const timelineOpacity = anime.timeline({
      easing: "easeOutExpo",
    });
    const timelineRotation = anime.timeline({
      easing: "easeOutExpo",
      loop: true,
    });

    timelineOpacity.add({
      targets: [image, header],
      opacity: [0, 1],
      duration: 1000,
      easing: "easeOutBack",
    });

    timelineRotation.add({
      targets: [image],
      rotate: {
        value: "+=180",
        duration: 600,
      },
    });

    timelineRotation.add(
      {
        targets: [image],
        rotate: {
          value: "+=180",
          duration: 600,
        },
      },
      "+=400"
    );
  }, []);

  return (
    <Stack className="mt-[200px]">
      <div ref={headerRef}>
        <Heading className="text-center text-2xl font-normal text-yellow">
          Shielded swap in
          <br />
          progress
        </Heading>
      </div>
      <div ref={imageContainerRef} className="flex items-center justify-center">
        <img
          className="max-w-[280px] animate-halfSpinBreak"
          src={swapInProgressImg}
          alt=""
        />
      </div>
    </Stack>
  );
};
