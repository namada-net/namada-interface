import clsx from "clsx";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import ReactPaginate, { ReactPaginateProps } from "react-paginate";
import styles from "./FormattedPaginator.module.css";

type FormattedPaginatorProps = ReactPaginateProps;

export const FormattedPaginator = (
  props: FormattedPaginatorProps
): JSX.Element => {
  return (
    <ReactPaginate
      className={clsx("mt-2", styles.paginator)}
      breakLabel="..."
      nextLabel={<FaChevronRight />}
      previousLabel={<FaChevronLeft />}
      renderOnZeroPageCount={null}
      {...props}
    />
  );
};
