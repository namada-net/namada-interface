import { ActionButton } from "@namada/components";

type ConnectProviderButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
  text?: string;
};

export const ConnectProviderButton = ({
  onClick,
  disabled,
  text,
}: ConnectProviderButtonProps): JSX.Element => {
  return (
    <ActionButton
      type="button"
      disabled={disabled}
      className="inline-flex top-0 right-0 w-auto text-xs px-2"
      onClick={onClick}
      size="xs"
      backgroundColor="white"
    >
      {text || "Select Address"}
    </ActionButton>
  );
};
