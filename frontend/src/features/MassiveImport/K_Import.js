import {
  OBJECT_NAME_MASSIVE_IMPORT_BASE,
  OPERTION_TYPE_BASE,
} from "../Setup/K_FieldBaseStructure";

export const Operations = {
  insert: "insert",
  update: "update",
};

//Structure form import
export const IMPORT_FIELD_STRUCTURE = {
  operation_type: OPERTION_TYPE_BASE(Operations),
  object_name: OBJECT_NAME_MASSIVE_IMPORT_BASE,
};
