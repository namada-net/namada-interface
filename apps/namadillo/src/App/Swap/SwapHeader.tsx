import { SwapIcon } from "App/Icons/SwapIcon";

export const SwapHeader = (): JSX.Element => {
  return (
    <header className="flex flex-col items-center text-center mb-8 gap-5">
      <h1 className="text-yellow"> Shielded Swaps </h1>
      <i className="flex items-center justify-center w-13 text-yellow mx-auto relative z-10">
        <SwapIcon />
      </i>
      <p>Swap an asset you hold in the shield pool</p>
    </header>
  );
};
