import { ActionButton } from "@namada/components";

type ConnectProviderButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
};

export const ConnectProviderButton = ({
  onClick,
  disabled,
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
      Connect Wallet
    </ActionButton>
  );
};
