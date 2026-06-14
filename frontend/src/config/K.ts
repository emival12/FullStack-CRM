import { MetadataFieldStructure } from "@/types/field.types";

import {
  EMAIL_LOGIN_BASE,
  OBJECT_NAME_MASSIVE_IMPORT_BASE,
  OPERTION_TYPE_BASE,
  PASSWORD_LOGIN_BASE,
} from "./K_FieldBaseStructure";

export const PATH_LOGIN = "/login";
export const PATH_DATABASE = "/database";
export const PATH_IMPORT = "/import";
export const PATH_SETUP = "/setup";

export const ERROR_MISSING_TABLE = "INPUT_TABLE_NAME_NOT_FOUND";
export const ERROR_MISSING_RECORD = "INPUT_RECORD_ID_NOT_FOUND";

export const NUM_RECORD_TO_SHOW = 15;

//LOGIN
//Structure form login
export const LOGIN_FIELD_STRUCTURE: MetadataFieldStructure = {
  email: EMAIL_LOGIN_BASE,
  password: PASSWORD_LOGIN_BASE,
};

//MASSIVE IMPORT
export const Operations = {
  insert: "insert",
  update: "update",
};

//Structure form import
export const IMPORT_FIELD_STRUCTURE: MetadataFieldStructure = {
  operation_type: OPERTION_TYPE_BASE(Operations),
  object_name: OBJECT_NAME_MASSIVE_IMPORT_BASE,
};
