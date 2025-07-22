import clsx from "clsx";
type CurrentStatusProps = {
  status: string;
  explanation?: React.ReactNode;
};

export const CurrentStatus = ({
  status,
  explanation,
}: CurrentStatusProps): JSX.Element => {
  return (
    <>
      <div
        className={clsx(
          "border border-current rounded-md px-4 py-2 text-yellow text-center"
        )}
      >
        <span className="animate-pulseFast">{status}</span>
      </div>
      <div className="text-center text-sm leading-tight text-yellow my-3 max-w-[80%] mx-auto min-h-[1.25rem]">
        {explanation}
      </div>
    </>
  );
};
