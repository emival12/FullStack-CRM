import { RecordListStructure } from "@/types/list.types";
import { isBlank } from "@/utils/string";

import type { FormatValueFunction } from "./DynamicRecordsList.types";

export const getFormatterDate = (language: string) => {
  return new Intl.DateTimeFormat(language, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export const getFormatterDateTime = (language: string) => {
  return new Intl.DateTimeFormat(language, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatValue: FormatValueFunction = (
  fieldValue,
  fieldType,
  formatterDate,
) => {
  if (isBlank(fieldValue)) return undefined;

  switch (fieldType) {
    case "date":
    case "datetime-local": {
      const formatter = formatterDate[fieldType];
      const date =
        fieldType === "date"
          ? new Date(fieldValue + "T00:00:00")
          : new Date(fieldValue);
      return formatter.format(date);
    }
    case "checkbox":
      return fieldValue ? true : false;
    default:
      return fieldValue;
  }
};

export const getFilteredData = (
  searchTerm: string,
  data: RecordListStructure,
  formatterDate: Record<string, Intl.DateTimeFormat>,
): RecordListStructure => {
  return searchTerm
    ? {
        ...data,
        records: data.records.filter((record) => {
          const formattedFields = data.fields.map((field) => {
            const value = formatValue(
              record[field.key],
              field.field_type,
              formatterDate,
            );
            return String(value ?? "").toLowerCase();
          });

          return formattedFields.some((element) =>
            element.includes(searchTerm.toLowerCase()),
          );
        }),
      }
    : data;
};
