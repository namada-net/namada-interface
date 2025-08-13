import { Modal } from "@namada/components";
import clsx from "clsx";
import React from "react";
import { IoClose } from "react-icons/io5";
import { twMerge } from "tailwind-merge";
import { ModalTransition } from "./ModalTransition";

type SelectModalProps = {
  children: React.ReactNode;
  title: React.ReactNode;
  onClose: () => void;
} & React.ComponentPropsWithoutRef<"div">;

export const SelectModal = ({
  children,
  title,
  onClose,
  className,
  ...props
}: SelectModalProps): JSX.Element => {
  return (
    <Modal onClose={onClose}>
      <ModalTransition>
        <div
          className={twMerge(
            clsx(
              "px-8 pt-3 pb-6 bg-black max-w-[480px] min-h-[120px]",
              "w-screen rounded-xl border border-neutral-700"
            ),
            className
          )}
          {...props}
        >
          <header className="flex w-full justify-center items-center relative mb-6 text-light leading-8 flex-shrink-0">
            {title}
            <i
              className="cursor-pointer text-white absolute -right-2.5 text-xl p-1.5 hover:text-yellow z-50"
              onClick={onClose}
            >
              <IoClose />
            </i>
          </header>
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>
      </ModalTransition>
    </Modal>
  );
};
