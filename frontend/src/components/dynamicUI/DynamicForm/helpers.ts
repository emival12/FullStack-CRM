import { BaseFieldInfo } from "@/types/field.types";
import { isBlank } from "@/utils/string";

import { Editability } from "./DynamicForm.types";

export const isDisabled = (
  editability: Editability,
  info: BaseFieldInfo,
): boolean => {
  return editability === "all"
    ? false
    : editability === "none"
      ? true
      : !info.is_editable;
};

export const calculateStep = (
  numeric_scale: number | null | undefined,
): string => {
  return numeric_scale ? "0." + "1".padStart(numeric_scale, "0") : "1";
};

export const calculateLimit = (
  limit_value: string | number | undefined,
): number | undefined => {
  return isBlank(limit_value) ? undefined : Number(limit_value);
};

export const calculateFieldLabel = (
  key: string,
  is_required: 0 | 1,
): string => {
  return key.replaceAll("_", " ") + (is_required ? " *" : "");
};
