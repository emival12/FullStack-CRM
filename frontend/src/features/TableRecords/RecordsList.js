import { useEffect, useState } from "react";
import { Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import MissingPage from "../../components/MissingPage";
import { MISSING_RECORD_LABEL } from "../../config/IT";
import { PATH_DATABASE } from "../../config/K";
import "../../App.css";
import PaginationControl from "../../components/PaginationControl";

//Dinamic construction of the body entry
const RecordCell = ({ value, isPrimaryKey, onNavigate }) => {
  if (isPrimaryKey) {
    return (
      <td
        className="cursor-pointer text-primary"
        onClick={() => onNavigate(value)}
      >
        {value}
      </td>
    );
  }
  return <td>{value}</td>;
};

/**
 * Shows a table with all the records
 *
 * @param {Object[]} props.recordsList       - List of the record retrieved
 * @param {String} props.tableKey            - Table currently selected
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
  tableKey,
  pathRedirect = PATH_DATABASE,
}) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const NUM_RECORD_TO_SHOW = 10;
  const primary_key_name = recordsList?.primary_key_name;

  // Calculate the slice of the data to show
  const dataStart = (currentPage - 1) * NUM_RECORD_TO_SHOW;
  const dataEnd = currentPage * NUM_RECORD_TO_SHOW;
  const recordsToShow = recordsList
    ? {
        ...recordsList,
        records: recordsList.records.slice(dataStart, dataEnd),
      }
    : null;

  // Calculate the total page number
  const numTotPages = recordsList
    ? Math.ceil(recordsList.records.length / NUM_RECORD_TO_SHOW)
    : 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [recordsList]);

  return (
    <>
      <Table bordered hover className="m-0">
        <thead>
          <tr>
            {Object.values(recordsList.fields).map((fieldName, i) => (
              <th key={i}>{fieldName.label.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {recordsToShow.records.map((record, index) => (
            <tr key={index}>
              {recordsList.fields.map((fieldName) => (
                <RecordCell
                  key={fieldName.key}
                  value={record[fieldName.key]}
                  isPrimaryKey={fieldName.key === primary_key_name}
                  onNavigate={(val) =>
                    navigate(`${pathRedirect}/${tableKey}/${val}`)
                  }
                />
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
      <PaginationControl
        numTotPages={numTotPages}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      {recordsList.records.length === 0 && (
        <MissingPage missingText={MISSING_RECORD_LABEL} ShowImg={false} />
      )}
    </>
  );
}
