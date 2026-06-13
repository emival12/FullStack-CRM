import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Table, Form, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { RecordListStructure } from "types/list.types";
import type {
  DynamicRecordsListProps,
  FormatValueFunction,
  RecordCellProps,
} from "./DynamicRecordsList.types";
import { NUM_RECORD_TO_SHOW, PATH_DATABASE } from "config/K";
import { useLabels } from "context/Label/Label";
import MissingPage from "components/MissingPage/MissingPage";
import PaginationControl from "components/PaginationControl/PaginationControl";

//Dinamic construction of the body entry
const RecordCell = ({
  fieldValue,
  fieldType,
  isPrimaryKey,
  onNavigate,
  formatterDate,
}: RecordCellProps) => {
  const formattedValue = formatValue(fieldValue, fieldType, formatterDate);

  if (isPrimaryKey) {
    return (
      <td
        className="cursor-pointer text-primary"
        onClick={() => onNavigate(encodeURIComponent(String(fieldValue)))}
      >
        {formattedValue}
      </td>
    );
  }

  if (formattedValue === undefined) return <td></td>;

  if (fieldType === "checkbox") {
    return formattedValue ? (
      <td className="text-center">
        <i className="bi bi-check-lg" />
      </td>
    ) : (
      <td></td>
    );
  }

  return <td>{formattedValue}</td>;
};

const getFormatterDate = (language: string) => {
  return new Intl.DateTimeFormat(language, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const getFormatterDateTime = (language: string) => {
  return new Intl.DateTimeFormat(language, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatValue: FormatValueFunction = (
  fieldValue,
  fieldType,
  formatterDate,
) => {
  if (fieldValue == null || fieldValue === "") return undefined;

  switch (fieldType) {
    case "date":
    case "datetime-local":
      const formatter = formatterDate[fieldType];
      const date =
        fieldType === "date"
          ? new Date(fieldValue + "T00:00:00")
          : new Date(fieldValue);
      return formatter.format(date);
    case "checkbox":
      return fieldValue ? true : false;
    default:
      return fieldValue;
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
  const { getLabel, language } = useLabels();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const formatterDate = useMemo(() => {
    return {
      date: getFormatterDate(language),
      "datetime-local": getFormatterDateTime(language),
    };
  }, [language]);

  // Calculate the data filtered by searchTerm
  const filteredData: RecordListStructure = useMemo(() => {
    return deferredSearchTerm
      ? {
          ...data,
          records: data?.records.filter((record) => {
            const formattedFields = data?.fields.map((field) => {
              const value = formatValue(
                record[field.key],
                field.field_type,
                formatterDate,
              );
              return String(value ?? "").toLowerCase();
            });

            return formattedFields.some((element) =>
              element.includes(deferredSearchTerm),
            );
          }),
        }
      : data;
  }, [deferredSearchTerm, data, formatterDate]);

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
            placeholder={getLabel("UI.SEARCH_PLACEHOLDER")}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          />
        </Col>
      </Row>
      <Table bordered hover className="m-0">
        <thead>
          <tr>
            {Object.values(data?.fields).map((fieldName, i) => (
              <th key={i}>{fieldName.label.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {recordsToShow?.records.map((record, index) => (
            <tr key={index}>
              {data?.fields.map((field) => (
                <RecordCell
                  key={field.key}
                  fieldValue={record[field.key]}
                  fieldType={field.field_type}
                  isPrimaryKey={field.key === primary_key_name}
                  onNavigate={(val: string) =>
                    navigate(`${pathRedirect}/${redirectKey}/${val}`)
                  }
                  formatterDate={formatterDate}
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
        <MissingPage missingText={getLabel("MISSING.RECORD")} showImg={false} />
      )}
    </>
  );
}
