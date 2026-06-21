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
  FORMULA = "formula",
}

export interface FieldOptionRadio {
  object_name?: string;
  record_type_name?: string;
  field_name?: string;
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
  options?: (FieldOptionRadio | FieldOptionLookup)[];
  value?: any;
  max_limit_value?: string | number;
  min_limit_value?: string | number;

  order?: number;
  is_textarea?: 0 | 1; //used only in the setup
  label?: string; //used only in the setup
}

export type MetadataFieldStructure = Record<string, BaseFieldInfo>;
