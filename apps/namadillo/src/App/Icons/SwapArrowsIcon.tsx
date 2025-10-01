type SwapArrowsIconProps = {
  color: string;
};

export const SwapArrowsIcon = ({ color }: SwapArrowsIconProps): JSX.Element => {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="22"
        fill="#262626"
        stroke={color}
        strokeWidth="3"
      />
      <path
        d="M16.6582 36.7599L22.4317 26.7599L10.8847 26.7599L16.6582 36.7599ZM15.6582 12.9259L15.6582 27.7599L17.6582 27.7599L17.6582 12.9259L15.6582 12.9259Z"
        fill={color}
      />
      <path
        d="M31.1543 12.9259L25.3808 22.9259L36.9278 22.9259L31.1543 12.9259ZM32.1543 36.7599L32.1543 21.9259L30.1543 21.9259L30.1543 36.7599L32.1543 36.7599Z"
        fill={color}
      />
    </svg>
  );
};
