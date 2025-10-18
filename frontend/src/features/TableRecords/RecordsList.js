import { Table } from "react-bootstrap";
import "../../App.css";

/**
 * Shows a table of record
 *
 * @param {Object[]} props.records       - List of the record to show
 */
export default function RecordsList({ records }) {
  return (
    <Table bordered hover className="m-0">
      <thead>
        <tr>
          {Object.keys(records[0]).map((key) => (
            <th key={key}>{key.toUpperCase().replace("_", " ")}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {records.map((record, index) => (
          <tr key={index}>
            {Object.values(record).map((value, i) => (
              <td key={i}>{value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
