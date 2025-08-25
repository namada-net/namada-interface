import { Input, Stack } from "@namada/components";

type CustomAddressFormProps = {
  memo: string | undefined;
  onChangeMemo: ((memo: string) => void) | undefined;
};

export const CustomAddressForm = ({
  memo,
  onChangeMemo,
}: CustomAddressFormProps): JSX.Element => {
  return (
    <Stack as="fieldset" gap={2}>
      {onChangeMemo && (
        <Input
          label="Memo"
          value={memo}
          onChange={(e) => onChangeMemo(e.target.value)}
          className="mt-4"
          placeholder="Insert memo here"
        />
      )}
    </Stack>
  );
};
