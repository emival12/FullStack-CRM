import { useEffect, useState } from "react";
import { Table, Form, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { PATH_DATABASE } from "../../config/K";
import { getLabel } from "../../config/Label";
import MissingPage from "../MissingPage";
import PaginationControl from "../PaginationControl";

//Dinamic construction of the body entry
const RecordCell = ({ fieldValue, fieldType, isPrimaryKey, onNavigate }) => {
  let correctFormatDate = formatDateSimple(fieldValue, fieldType);

  if (isPrimaryKey) {
    return (
      <td
        className="cursor-pointer text-primary"
        onClick={() => onNavigate(fieldValue)}
      >
        {fieldValue}
      </td>
    );
  }
  return <td>{correctFormatDate || fieldValue}</td>;
};

const formatDateSimple = (fieldValue, fieldType) => {
  if (!fieldValue) return undefined;

  if (fieldType === "date") {
    const dateSplit = fieldValue.toString().split("-");
    return `${dateSplit[2]}/${dateSplit[1]}/${dateSplit[0]}`;
  } else if (fieldType === "datetime-local") {
    const dateTimeSplit = fieldValue.toString().split("T");
    const dateSplit = dateTimeSplit[0].split("-");
    return `${dateSplit[2]}/${dateSplit[1]}/${dateSplit[0]} ${dateTimeSplit[1].substring(0, 5)}`;
  } else {
    return undefined;
  }
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
              {data.fields.map((field) => (
                <RecordCell
                  key={field.key}
                  fieldValue={record[field.key]}
                  fieldType={field.field_type}
                  isPrimaryKey={field.key === primary_key_name}
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
