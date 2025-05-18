import { useState } from "react";
import { Address } from "types";
import { SelectToken } from "./SelectToken";

type Token = {
  address: Address;
  symbol: string;
  name: string;
  amount: string;
  value: string;
  icon?: string;
};

export const SelectTokenExample = (): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  const handleOpen = (): void => {
    setIsOpen(true);
  };

  const handleClose = (): void => {
    setIsOpen(false);
  };

  const handleSelect = (token: Token): void => {
    setSelectedToken(token);
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

      {selectedToken && (
        <div className="mt-4 p-4 border border-neutral-700 rounded">
          <h3 className="text-lg mb-2">Selected Token:</h3>
          <p>Name: {selectedToken.name}</p>
          <p>Symbol: {selectedToken.symbol}</p>
          <p>Amount: {selectedToken.amount}</p>
          <p>Value: {selectedToken.value}</p>
        </div>
      )}

      <SelectToken
        isOpen={isOpen}
        onClose={handleClose}
        onSelect={handleSelect}
      />
    </div>
  );
};
