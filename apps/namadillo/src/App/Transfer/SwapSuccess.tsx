import { Heading, Stack } from "@namada/components";
import anime from "animejs";
import { useEffect, useRef } from "react";
import { CgCheck } from "react-icons/cg";

type SwapSuccessProps = {
  onComplete: () => void;
};

export const SwapSuccess = ({ onComplete }: SwapSuccessProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !headerRef.current) return;

    const circles =
      containerRef.current.querySelectorAll<HTMLDivElement>(".circle");

    const header = headerRef.current.children[0] as HTMLHeadingElement;

    const [outer, middle, inner, center] = circles;

    const timeline = anime.timeline({
      easing: "easeOutExpo",
    });

    // Step 1: Outer ring shows
    timeline.add({
      targets: outer,
      scale: [0, 1],
      opacity: [0, 1],
      duration: 1000,
    });

    // Step 2: Middle ring shows while outer fades
    timeline.add(
      {
        targets: middle,
        scale: [0, 1],
        opacity: [0, 1],
        duration: 1000,
      },
      "-=500" // overlap with previous step
    );
    timeline.add(
      {
        targets: outer,
        opacity: [1, 0],
        scale: [1, 0.5],
        duration: 1000,
      },
      "-=1000"
    );

    // Step 3: Inner ring shows while middle fades
    timeline.add(
      {
        targets: inner,
        scale: [0, 1],
        opacity: [0, 1],
        duration: 1000,
      },
      "-=500"
    );
    timeline.add(
      {
        targets: middle,
        opacity: [1, 0],
        scale: [1, 0.5],
        duration: 1000,
      },
      "-=1000"
    );

    // Step 4: Filled center circle shows while inner fades
    timeline.add(
      {
        targets: [center, header],
        opacity: [0, 1],
        duration: 1000,
        easing: "easeOutBack",
      },
      "-=500"
    );

    timeline.add(
      {
        targets: inner,
        opacity: [1, 0],
        duration: 1000,
      },
      "-=1000"
    );
  }, []);

  // Redirect after some time
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("completed 2");
      onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Stack className="mt-[200px]" gap={0}>
      <div ref={headerRef}>
        <Heading className="heading text-center text-2xl font-normal text-yellow">
          Complete
        </Heading>
      </div>
      <div className="flex items-center justify-center h-[280px]">
        <div ref={containerRef} className="relative">
          {/* Outer ring */}
          <div
            className="circle absolute rounded-full border border-yellow-400"
            style={{
              width: 280,
              height: 280,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />

          {/* Middle ring */}
          <div
            className="circle absolute rounded-full border border-yellow-400"
            style={{
              width: 210,
              height: 210,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />

          {/* Inner ring */}
          <div
            className="circle absolute rounded-full border border-yellow-400"
            style={{
              width: 165,
              height: 165,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />

          {/* Final filled circle */}
          <div
            className="flex items-center justify-center circle absolute rounded-full bg-yellow-400"
            style={{
              width: 155,
              height: 155,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <CgCheck className="text-black scale-[12]" />
          </div>
        </div>
      </div>
    </Stack>
  );
};
