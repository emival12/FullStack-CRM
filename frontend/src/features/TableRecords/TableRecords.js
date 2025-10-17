import { Table } from "react-bootstrap";
import "./TableRecords.css";

/**
 * Shows a table of record
 *
 * @param {Object[]} props.records       - List of the record to show
 */
export default function TableRecords({ records }) {
  return (
    <div className="tableWrapper">
      <Table bordered hover>
        <thead className="headerCellColor">
          <tr>
            {Object.keys(records[0]).map((key) => (
              <th key={key}>{key.toUpperCase().replace("_", " ")}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bodyCellColor">
          {records.map((record, index) => (
            <tr key={index}>
              {Object.values(record).map((value, i) => (
                <td key={i}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
