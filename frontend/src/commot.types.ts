export type ToastConfig = {
  show: boolean;
  title: string;
  body: string;
  color?: "success" | "danger" | "warning";
};

export type ModalConfig = {
  show: boolean;
  title: string;
  body: string;
};

//Types for the Dynamic List
export interface FieldDefinition {
  key: string;
  label: string;
  field_type: string;
}

export interface RecordListStructure {
  fields: FieldDefinition[];
  primary_key_name: string;
  records: Record<string, any>[];
}

//Types for the Dynamic Form
export enum FieldType {
  TEXT = "text",
  NUMBER = "number",
  LOOKUP = "lookup",
  PICKLIST = "picklist",
  ROLLUP = "rollup",
  RADIO = "radio",
  CHECKBOX = "checkbox",
  DATE = "date",
  DATE_TIME = "datetime-local",
  IMG = "image",
  AUTO_NUMBER = "auto_number",
}

export interface FieldOptionRadio {
  object_name: string;
  record_type_name: string;
  field_name: string;
  option_label: string;
  option_key: string;
}

export interface FieldOptionLookup {
  reference_field: string;
  id: string | number;
}

export interface BaseFieldInfo {
  object_name?: string;
  record_type_name?: string;
  field_name: string;
  field_type: FieldType | "email" | "password";
  length?: number | null;
  numeric_precision?: number | null;
  numeric_scale?: number | null;
  reference_object?: string | null;
  reference_field?: string | null;
  is_editable: 0 | 1;
  is_required: 0 | 1;
  is_primary_key?: 0 | 1;
  lookup_filter?: string;
  options?: (FieldOptionRadio & FieldOptionLookup)[];
  value?: any;
  max_limit_value?: string;
  min_limit_value?: string;

  order?: number;
  is_textarea?: boolean; //used only in the setup
  label?: string; //used only in the setup
}

export type MetadataFieldStructure = Record<string, BaseFieldInfo>;

//Types for the outlet of Database
export interface DatabaseOutletContext {
  /** Key of the table selected: table_name + table_record_type_name */
  tableKey: string;

  /** Id of the record selected */
  recordId: string | undefined;
}
