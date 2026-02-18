import { useEffect, useState } from "react";
import { Table, Form, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import type {
  DynamicRecordsListProps,
  FormatDateSimpleFunction,
  RecordCellProps,
  RecordListStructure,
} from "./DynamicRecordsList.types.js";

import { useLabels } from "@context/Label/Label.js";
import { NUM_RECORD_TO_SHOW, PATH_DATABASE } from "@config/K.js";
import MissingPage from "@components/MissingPage/MissingPage.js";
import PaginationControl from "@components/PaginationControl/PaginationControl.js";

//Dinamic construction of the body entry
const RecordCell = ({
  fieldValue,
  fieldType,
  isPrimaryKey,
  onNavigate,
}: RecordCellProps) => {
  let correctFormatDate = formatDateSimple(fieldValue, fieldType);

  if (isPrimaryKey) {
    return (
      <td
        className="cursor-pointer text-primary"
        onClick={() => onNavigate(String(fieldValue))}
      >
        {fieldValue}
      </td>
    );
  }
  return <td>{correctFormatDate || fieldValue}</td>;
};

const formatDateSimple: FormatDateSimpleFunction = (fieldValue, fieldType) => {
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
 */
export default function DynamicRecordsList({
  data,
  redirectKey,
  pathRedirect = PATH_DATABASE,
}: DynamicRecordsListProps): React.ReactElement {
  const { getLabel } = useLabels();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Calculate the data filtered by searchTerm
  const filteredData: RecordListStructure = searchTerm
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
  const dataStart: number = (currentPage - 1) * NUM_RECORD_TO_SHOW;
  const dataEnd: number = currentPage * NUM_RECORD_TO_SHOW;

  // Calculate the total page number
  const numTotPages: number = filteredData
    ? Math.ceil(filteredData.records.length / NUM_RECORD_TO_SHOW)
    : 0;

  // Calculate the actual record showed in the UI
  const recordsToShow: RecordListStructure | null = filteredData
    ? {
        ...filteredData,
        records: filteredData.records.slice(dataStart, dataEnd),
      }
    : null;

  const primary_key_name = data?.primary_key_name;

  useEffect(() => {
    setCurrentPage(1);
  }, [data, searchTerm]);

  return (
    <>
      <Row className="justify-content-end mb-3 mt-4">
        <Col xs={12} md={4}>
          <Form.Control
            type="text"
            placeholder={getLabel("GENERIC.SEARCH_PLACEHOLDER_LABEL") as string}
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
          {recordsToShow?.records.map((record, index) => (
            <tr key={index}>
              {data.fields.map((field) => (
                <RecordCell
                  key={field.key}
                  fieldValue={record[field.key]}
                  fieldType={field.field_type}
                  isPrimaryKey={field.key === primary_key_name}
                  onNavigate={(val: string) =>
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
      {recordsToShow?.records.length === 0 && (
        <MissingPage
          missingText={getLabel("MISSING.MISSING_RECORD_LABEL") as string}
          showImg={false}
        />
      )}
    </>
  );
}
