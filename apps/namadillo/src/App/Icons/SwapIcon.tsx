type SwapIconProps = {
  color: string;
};

export const SwapIcon = ({ color }: SwapIconProps): JSX.Element => {
  return (
    <svg viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <circle
          cx="4.96143"
          cy="5.57031"
          r="4.375"
          fill={color}
          stroke="black"
        />
        <circle
          cx="9.83643"
          cy="10.4453"
          r="4.375"
          fill={color}
          stroke="black"
        />
      </g>
    </svg>
  );
};
