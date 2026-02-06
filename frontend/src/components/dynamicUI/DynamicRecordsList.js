import { useEffect, useState } from "react";
import { Table, Form, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { PATH_DATABASE } from "../../config/K";
import { getLabel } from "../../config/Label";
import MissingPage from "../MissingPage";
import PaginationControl from "../PaginationControl";

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
 * @param {Object[]} props.data                 - List of the record retrieved
 * @param {String} props.redirectKey            - Table currently selected
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
export default function DynamicRecordsList({
  data,
  redirectKey,
  pathRedirect = PATH_DATABASE,
}) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const NUM_RECORD_TO_SHOW = 15;
  const primary_key_name = data?.primary_key_name;

  // Calculate the data filtered by searchTerm
  const filteredData = searchTerm
    ? {
        ...data,
        records: data?.records.filter((record) => {
          const concatenedValues = Object.values(record)
            .join("_")
            .toLowerCase();
          return concatenedValues.includes(searchTerm);
        }),
      }
    : data;

  // Calculate the slice of the data to show
  const dataStart = (currentPage - 1) * NUM_RECORD_TO_SHOW;
  const dataEnd = currentPage * NUM_RECORD_TO_SHOW;
  const recordsToShow = filteredData
    ? {
        ...filteredData,
        records: filteredData.records.slice(dataStart, dataEnd),
      }
    : null;

  // Calculate the total page number
  const numTotPages = filteredData
    ? Math.ceil(filteredData.records.length / NUM_RECORD_TO_SHOW)
    : 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [data, searchTerm]);

  return (
    <>
      <Row className="justify-content-end mb-3 mt-4">
        <Col xs={12} md={4}>
          <Form.Control
            type="text"
            placeholder={getLabel("GENERIC.SEARCH_PLACEHOLDER_LABEL")}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          />
        </Col>
      </Row>
      <Table bordered hover className="m-0">
        <thead>
          <tr>
            {Object.values(data.fields).map((fieldName, i) => (
              <th key={i}>{fieldName.label.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {recordsToShow.records.map((record, index) => (
            <tr key={index}>
              {data.fields.map((fieldName) => (
                <RecordCell
                  key={fieldName.key}
                  value={record[fieldName.key]}
                  isPrimaryKey={fieldName.key === primary_key_name}
                  onNavigate={(val) =>
                    navigate(`${pathRedirect}/${redirectKey}/${val}`)
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
      {recordsToShow.records.length === 0 && (
        <MissingPage
          missingText={getLabel("MISSING.MISSING_RECORD_LABEL")}
          ShowImg={false}
        />
      )}
    </>
  );
}
