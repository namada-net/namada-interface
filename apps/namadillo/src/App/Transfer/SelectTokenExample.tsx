import { useState } from "react";
import { SelectToken } from "./SelectToken";

export const SelectTokenExample = (): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = (): void => {
    setIsOpen(true);
  };

  const handleClose = (): void => {
    setIsOpen(false);
  };

  const handleSelect = (): void => {
    setIsOpen(false);
  };

  return (
    <div>
      <button
        onClick={handleOpen}
        className="px-4 py-2 bg-yellow-500 text-black rounded"
      >
        Select Token
      </button>

      <SelectToken
        isOpen={isOpen}
        onClose={handleClose}
        onSelect={handleSelect}
      />
    </div>
  );
};
