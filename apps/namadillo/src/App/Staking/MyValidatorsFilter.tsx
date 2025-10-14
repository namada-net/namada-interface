import {
  ActionButton,
  ActionButtonProps,
  Stack,
  StyledSelectBox,
} from "@namada/components";
import clsx from "clsx";
import { ValidatorFilterOptions } from "types";

type MyValidatorsFilterProps = {
  onChangeFilter: (type: ValidatorFilterOptions) => void;
  onToggleMyValidatorsFilterActive: (active: boolean) => void;
  myValidatorsFilterActive: boolean;
  filter: ValidatorFilterOptions;
};

export const MyValidatorsFilter = ({
  onChangeFilter,
  onToggleMyValidatorsFilterActive,
  myValidatorsFilterActive,
  filter = "all",
}: MyValidatorsFilterProps): JSX.Element => {
  const getButtonProps = (selected: boolean): ActionButtonProps<"button"> => {
    return {
      size: "sm",
      type: "button",
      borderRadius: "sm",
      outlineColor: "white",
      backgroundColor: selected ? "white" : "transparent",
      backgroundHoverColor: "white",
      textColor: selected ? "black" : "white",
      textHoverColor: "black",
    };
  };

  return (
    <Stack gap={1.5} direction="horizontal" as="ul">
      <li>
        <StyledSelectBox
          id="validator-filter"
          defaultValue="all"
          value={filter}
          containerProps={{
            className: clsx(
              "text-sm min-w-[200px] flex-1 border border-white rounded-sm",
              "px-4 py-[9px]"
            ),
          }}
          arrowContainerProps={{ className: "right-4" }}
          listContainerProps={{ className: "w-full mt-2 border border-white" }}
          listItemProps={{
            className: "text-sm border-0 py-0 [&_label]:py-1.5",
          }}
          onChange={(e) =>
            onChangeFilter(e.target.value as ValidatorFilterOptions)
          }
          options={[
            {
              id: "all",
              value: "All",
              ariaLabel: "All",
            },
            {
              id: "active",
              value: "Active",
              ariaLabel: "Active",
            },
            {
              id: "belowThreshold",
              value: "Active Below Threshold",
              ariaLabel: "Active Below Threshold",
            },
            {
              id: "jailed",
              value: "Jailed",
              ariaLabel: "Jailed",
            },
            {
              id: "inactive",
              value: "Inactive",
              ariaLabel: "Inactive",
            },
          ]}
        />
      </li>
      <li>
        <ActionButton
          {...getButtonProps(myValidatorsFilterActive)}
          aria-selected={myValidatorsFilterActive}
          onClick={() =>
            onToggleMyValidatorsFilterActive(!myValidatorsFilterActive)
          }
        >
          Your Validators
        </ActionButton>
      </li>
    </Stack>
  );
};
