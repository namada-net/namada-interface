import { Tooltip } from "@namada/components";
import { BsEye, BsEyeSlash } from "react-icons/bs";

export const ShieldedPropertiesTooltip = (): JSX.Element => (
  <Tooltip position="top" className="z-50 rounded-lg -mt-2">
    <div className="min-w-[15rem] py-2 space-y-3">
      <p className="text-white text-sm font-medium">Transaction Privacy:</p>
      <div className="flex w-full items-center justify-between">
        <span className="text-neutral-400 text-sm">Sender address</span>
        <span className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">Visible</span>
          <BsEye className="text-white w-4 h-4" />
        </span>
      </div>
      <div className="flex w-full items-center justify-between">
        <span className="text-neutral-400 text-sm">Asset</span>
        <span className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">Visible</span>
          <BsEye className="text-white w-4 h-4" />
        </span>
      </div>
      <div className="flex w-full items-center justify-between">
        <span className="text-neutral-400 text-sm">Amount</span>
        <span className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">Visible</span>
          <BsEye className="text-white w-4 h-4" />
        </span>
      </div>
      <div className="flex w-full items-center justify-between">
        <span className="text-neutral-400 text-sm">Recipient address</span>
        <span className="flex items-center gap-2">
          <span className="text-yellow-400 text-sm font-medium">Hidden</span>
          <BsEyeSlash className="text-yellow-400 w-4 h-4" />
        </span>
      </div>
    </div>
  </Tooltip>
);
