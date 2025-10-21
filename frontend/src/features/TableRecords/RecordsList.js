import { Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import MissingPage from "../../components/MissingPage";
import { MISSING_RECORD_LABEL } from "../../config/IT";
import { PATH_DATABASE } from "../../config/K";
import "../../App.css";

/**
 * Shows a table of record
 *
 * @param {Object[]} props.records                - List of the record to show
 * @param {Object[]} props.selectedTable          - Table currently selected
 * @param {Object[]} props.onSelectedRecord       - Function to update the selected record
 */
export default function RecordsList({
  records,
  selectedTable,
  onSelectedRecord,
}) {
  const navigate = useNavigate();

  //Message shown in case of missing records
  const missingRecordsMsg = () => {
    if (records.records.length === 0) {
      return <MissingPage MissingText={MISSING_RECORD_LABEL} ShowImg={false} />;
    }
  };

  //Dinamic construction of the body entry
  const tableEntry = (key, value, record) => {
    if (key == records.primary_key_name) {
      return (
        <td
          key={key}
          className="cursor-pointer text-primary"
          onClick={() => {
            onSelectedRecord(record);
            navigate(PATH_DATABASE + "/" + selectedTable.label + "/" + value);
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
            {Object.values(records.fields).map((fieldName, i) => (
              <th key={i}>{fieldName.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.records.map((record, index) => (
            <tr key={index}>
              {Object.entries(record).map(([key, value]) =>
                tableEntry(key, value, record)
              )}
            </tr>
          ))}
        </tbody>
      </Table>
      {missingRecordsMsg()}
    </>
  );
}
