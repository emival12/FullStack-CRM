export interface PaginationControlProps {
  /** Number of total pages available for the table */
  numTotPages: number;

  /** Current page selected */
  currentPage: number;

  /** Set method of the number currentPage */
  setCurrentPage: (currentPage: number) => void;
}
