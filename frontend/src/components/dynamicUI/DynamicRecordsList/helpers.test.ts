import { describe, expect, it } from "vitest";

import { RecordListStructure } from "@/types/list.types";

import {
  formatValue,
  getFilteredData,
  getFormatterDate,
  getFormatterDateTime,
} from "./helpers";

describe("formatValue", () => {
  const formatterDate = {
    date: getFormatterDate("it"),
    "datetime-local": getFormatterDateTime("it"),
  };

  it.each([
    ["", "text", undefined],
    [null, "text", undefined],
  ])(
    "returns undefined for empty values - %#",
    (fieldValue, fieldType, expected) => {
      const outputValue = formatValue(fieldValue, fieldType, formatterDate);
      expect(outputValue).toBe(expected);
    },
  );

  it.each([
    ["2026-08-06", "date", "06/08/2026"],
    ["2026-08-06T18:15:30", "datetime-local", "06/08/2026, 18:15"],
  ])(
    "returns formatted dates based on the formatter - %#",
    (fieldValue, fieldType, expected) => {
      const outputValue = formatValue(fieldValue, fieldType, formatterDate);
      expect(outputValue).toBe(expected);
    },
  );

  it.each([
    [1, "checkbox", true],
    [0, "checkbox", false],
  ])(
    "returns boolean from 0/1 values - %#",
    (fieldValue, fieldType, expected) => {
      const outputValue = formatValue(fieldValue, fieldType, formatterDate);
      expect(outputValue).toBe(expected);
    },
  );

  it("returns the plain value with no transformation", () => {
    const outputValue = formatValue("text_example", "text", formatterDate);
    expect(outputValue).toBe("text_example");
  });
});

describe("getFilteredData", () => {
  const formatterDate = {
    date: getFormatterDate("it"),
    "datetime-local": getFormatterDateTime("it"),
  };

  it("returns only the records whose values match the search term", () => {
    const data: RecordListStructure = {
      fields: [
        { key: "id", label: "id", field_type: "auto_number" },
        { key: "name", label: "name", field_type: "text" },
      ],
      primary_key_name: "id",
      records: [
        {
          id: 1,
          name: "Maria",
        },
        {
          id: 2,
          name: "Mario",
        },
        {
          id: 3,
          name: "Gianfranco",
        },
      ],
    };

    const outputValue = getFilteredData("Mar", data, formatterDate);
    expect(outputValue).toStrictEqual({
      fields: [
        { key: "id", label: "id", field_type: "auto_number" },
        { key: "name", label: "name", field_type: "text" },
      ],
      primary_key_name: "id",
      records: [
        {
          id: 1,
          name: "Maria",
        },
        {
          id: 2,
          name: "Mario",
        },
      ],
    });
  });
});
