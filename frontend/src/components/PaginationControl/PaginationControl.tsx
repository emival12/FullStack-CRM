import { Pagination } from "react-bootstrap";
import type { PaginationControlProps } from "./PaginationControl.types.js";

/**
 * Displays a Pagination item to change the records showed
 */
export default function PaginationControl({
  numTotPages,
  currentPage,
  setCurrentPage,
}: PaginationControlProps): React.ReactElement | null {
  const MAX_VISIBLE_PAGES = 3;

  // Calculate the pages number to show in the pagination component
  const pageNumbers: number[] = [];
  const startPage = Math.max(
    1,
    currentPage - Math.floor(MAX_VISIBLE_PAGES / 2),
  );
  const endPage = Math.min(numTotPages, startPage + MAX_VISIBLE_PAGES - 1);
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const goToPage = (page: number) => {
    if (page < 1 || page > numTotPages) return;
    setCurrentPage(page);
  };

  // If there are just one page, we don't need to see the pagination UI
  if (numTotPages <= 1) return null;

  return (
    <Pagination className="mt-2 mb-0 justify-content-center">
      <Pagination.First
        disabled={currentPage === 1}
        onClick={() => goToPage(1)}
      />

      <Pagination.Prev
        disabled={currentPage === 1}
        onClick={() => goToPage(currentPage - 1)}
      />

      {pageNumbers.map((number) => (
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => goToPage(number)}
        >
          {number}
        </Pagination.Item>
      ))}

      <Pagination.Next
        disabled={currentPage === numTotPages}
        onClick={() => goToPage(currentPage + 1)}
      />

      <Pagination.Last
        disabled={currentPage === numTotPages}
        onClick={() => goToPage(numTotPages)}
      />
    </Pagination>
  );
}
