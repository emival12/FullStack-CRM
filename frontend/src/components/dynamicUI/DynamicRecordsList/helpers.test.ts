import { describe, expect, it } from "vitest";

import { formatValue, getFormatterDate, getFormatterDateTime } from "./helpers";

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
