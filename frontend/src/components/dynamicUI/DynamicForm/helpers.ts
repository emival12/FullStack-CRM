import { BaseFieldInfo } from "types/field.types";
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
