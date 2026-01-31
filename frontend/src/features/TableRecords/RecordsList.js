import { useEffect, useState } from "react";
import { Table, Pagination } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import MissingPage from "../../components/MissingPage";
import { MISSING_RECORD_LABEL } from "../../config/IT";
import { PATH_DATABASE } from "../../config/K";
import "../../App.css";

/**
 * Shows a table of record
 *
 * @param {Object[]} props.recordsList                - List of the record to show
 * @param {Object} props.selectedTable            - Table currently selected
 * @param {Function} props.onSelectedRecord       - Function to update the selected record
 */
/**
 * Records structure:
 * {
 *   "fields": [ "nameOfField_1", ... ],
 *   "primary_key_name": "nameOfPrimaryKeyField",
 *   "table": {
 *      "object_name": "...",
 *      ...
 *      "key": "..."
 *    },
 *   "records": [
 *       {
 *           "nameOfField_1": value_1,
 *           ...
 *       },
 *       ...
 *   ]
 * }
 */
export default function RecordsList({
  recordsList,
  selectedTableKey,
  onSelectedTable,
  onSelectedRecord,
  pathRedirect = PATH_DATABASE,
}) {
  const navigate = useNavigate();

  const NUM_RECORD_TO_SHOW = 10;
  const MAX_VISIBLE_PAGES = 3;

  const [currentPage, setCurrentPage] = useState(1);
  // Calculate the total page number
  const numPages = recordsList
    ? Math.ceil(recordsList.records.length / NUM_RECORD_TO_SHOW)
    : 0;

  // Calculate the slice of the data to show
  const start = (currentPage - 1) * NUM_RECORD_TO_SHOW;
  const end = currentPage * NUM_RECORD_TO_SHOW;
  const recordsToShow = recordsList
    ? {
        ...recordsList,
        records: recordsList.records.slice(start, end),
      }
    : null;

  // Calculate the pages number to show in the pagination component
  const pageNumbers = [];
  const startPage = Math.max(
    1,
    currentPage - Math.floor(MAX_VISIBLE_PAGES / 2),
  );
  const endPage = Math.min(numPages, startPage + MAX_VISIBLE_PAGES - 1);
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [recordsList]);

  const goToPage = (page) => {
    if (page < 1 || page > numPages) return;
    setCurrentPage(page);
  };

  //Message shown in case of missing recordsList
  const missingRecordsMsg = () => {
    if (recordsList.records.length === 0) {
      return <MissingPage MissingText={MISSING_RECORD_LABEL} ShowImg={false} />;
    }
  };

  //Dinamic construction of the body entry
  const tableEntry = (key, value, record) => {
    if (key === recordsList.primary_key_name) {
      return (
        <td
          key={key}
          className="cursor-pointer text-primary"
          onClick={() => {
            let tableKey = selectedTableKey;
            if (record?.table && selectedTableKey !== record.table.key) {
              tableKey = record.table.key;
              onSelectedTable(tableKey);
            }

            onSelectedRecord({
              record: record,
              primary_key: recordsList.primary_key_name,
            });
            navigate(pathRedirect + "/" + tableKey + "/" + value);
          }}
        >
          {value}
        </td>
      );
    } else {
      return <td key={key}>{value}</td>;
    }
  };

  return (
    <>
      <Table bordered hover className="m-0">
        <thead>
          <tr>
            {Object.values(recordsList.fields).map((fieldName, i) => (
              <th key={i}>{fieldName.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {recordsToShow.records.map((record, index) => (
            <tr key={index}>
              {Object.entries(record).map(([key, value]) =>
                tableEntry(key, value, record),
              )}
            </tr>
          ))}
        </tbody>
      </Table>
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
          disabled={currentPage === numPages}
          onClick={() => goToPage(currentPage + 1)}
        />

        <Pagination.Last
          disabled={currentPage === numPages}
          onClick={() => goToPage(numPages)}
        />
      </Pagination>
      {missingRecordsMsg()}
    </>
  );
}
