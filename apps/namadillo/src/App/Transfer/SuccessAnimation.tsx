import anime from "animejs";
import { TokenAmountCard } from "App/Common/TokenAmountCard";
import BigNumber from "bignumber.js";
import clsx from "clsx";
import { useScope } from "hooks/useScope";
import { useRef } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { Asset } from "types";

type SuccessAnimationProps = {
  amount: BigNumber;
  asset: Asset;
  onCompleteAnimation?: () => void;
};

export const SuccessAnimation = ({
  amount,
  asset,
  onCompleteAnimation,
}: SuccessAnimationProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);

  useScope((query, container) => {
    // Current card (declared in this component)
    const animationCard = query(
      "[data-animation=token-amount-card]"
    )[0] as HTMLDivElement;

    // All other token cards on the screen
    const tokenCards = Array.from(
      document.querySelectorAll("[data-animation=token-amount-card]")
    ).filter((card) => card !== animationCard);

    const confirmation = query("[data-animation=confirmation]")[0];

    let bottomCard;

    // Find the card that is at the bottom of the screen, so we can reposition
    // the success animation to be above it
    for (const card of tokenCards) {
      const bottom = card.getBoundingClientRect().y;
      if (!bottomCard || bottom > bottomCard.getBoundingClientRect().y) {
        bottomCard = card;
      }
    }

    if (!bottomCard) return;

    // Set the animationCard to the same height of the bottom card
    animationCard.style.position = "absolute";
    animationCard.style.top = `${bottomCard.getBoundingClientRect().y - container.getBoundingClientRect().y}px`;

    // Calculate the position of the animation card in the center of the container
    const containerCenter =
      container.getBoundingClientRect().height / 2 -
      bottomCard.getBoundingClientRect().height / 2;

    const rings = query('[data-animation="ring"]');
    const ringContainer = query('[data-animation="ring-container"]')[0];

    if (!ringContainer) return;

    setTimeout(() => {
      const timeline = anime.timeline({
        easing: "easeOutExpo",
        complete: () => {
          setTimeout(() => {
            onCompleteAnimation?.();
          }, 1500);
        },
      });

      // # Resetting elements to their initial values:
      timeline.add({ targets: rings, opacity: 0, duration: 1 }, 0);
      timeline.add(
        {
          targets: tokenCards[1],
          opacity: [1, 0],
          duration: 1,
        },
        0
      );
      timeline.add(
        {
          targets: tokenCards[1],
          opacity: 0,
          duration: 1,
        },
        0
      );
      timeline.add({ targets: animationCard, opacity: 1, duration: 1 }, 0);
      timeline.add({ targets: ringContainer, opacity: 0, duration: 1 }, 0);

      // # Initialize animationCard values
      // Hiding all other cards, but only the first card animates
      timeline.add(
        {
          targets: tokenCards[0],
          opacity: 0,
          duration: 500,
        },
        0
      );

      // animationCard goes up to the center of the container
      timeline.add(
        {
          targets: animationCard,
          duration: 1000,
          top: containerCenter,
        },
        "-=500"
      );

      // Displaying concentric rings, one by one
      timeline.add(
        { targets: ringContainer, opacity: 1, duration: 1 },
        "-=600"
      );

      timeline.add(
        {
          targets: animationCard.querySelector(
            "[data-animation=token-amount-card-text]"
          ),
          opacity: 0,
          duration: 600,
        },
        "-=300"
      );

      timeline.add(
        {
          targets: rings,
          opacity: [0, 1],
          duration: 600,
          scale: [0, 1],
          delay: anime.stagger(70),
        },
        "-=400"
      );

      timeline.add({
        targets: [...rings, animationCard],
        scale: 0,
        duration: 500,
      });

      // Displays success box confirmation
      timeline.add({
        targets: confirmation,
        duration: 1000,
        easing: "easeOutElastic(1, .6)",
        scale: [0, 1],
        opacity: [0, 1],
      });

      timeline.add({
        targets: confirmation,
        top: "-=150px",
        opacity: [1, 0],
        duration: 500,
      });
    }, 1000);
  }, containerRef);

  const renderRing = (className: string): JSX.Element => (
    <span
      data-animation="ring"
      className={clsx(
        "absolute aspect-square border-2 border-yellow rounded-full",
        className
      )}
    />
  );

  return (
    <div
      ref={containerRef}
      className="absolute h-full w-full top-0 left-0 z-50"
    >
      <span className="flex justify-center absolute w-full h-full top-0 left-0">
        <TokenAmountCard displayAmount={amount} asset={asset} />
      </span>

      <span
        data-animation="ring-container"
        className={clsx(
          "absolute w-full h-full circles -top-5 left-0 opacity-0",
          "flex items-center justify-center pointer-events-none"
        )}
      >
        {renderRing("h-30")}
        {renderRing("h-60")}
        {renderRing("h-96")}
        <span
          data-animation="confirmation"
          className={clsx(
            "absolute text-success text-[70px] aspect-square",
            "rounded-full opacity-0"
          )}
        >
          <FaCheckCircle />
        </span>
      </span>
    </div>
  );
};
