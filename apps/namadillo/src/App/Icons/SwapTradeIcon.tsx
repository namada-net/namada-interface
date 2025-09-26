type SwapTradeIcon = {
  color: string;
};

export const SwapTradeIcon = ({ color }: SwapTradeIcon): JSX.Element => {
  return (
    <svg
      width="13"
      height="25"
      viewBox="0 0 13 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.5874 24.7425L12.3609 14.7425L0.8139 14.7425L6.5874 24.7425ZM5.5874 0.9086L5.5874 15.7425L7.5874 15.7425L7.5874 0.9086L5.5874 0.9086Z"
        fill={color}
      />
    </svg>
  );
};
