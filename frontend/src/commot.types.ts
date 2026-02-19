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

//###############################################
// DATABASE
//###############################################
export interface DatabaseOutletContext {
  /** Key of the table selected: table_name + table_record_type_name */
  tableKey: string;

  /** Id of the record selected */
  recordId: string | undefined;
}

//###############################################
// SETUP
//###############################################
export enum Sections {
  HOME = "home",
  FIELDS = "fields",
  LAYOUT = "layout",
  RECORD_TYPES = "record_types",
  RELATED_LISTS = "related_lists",
}

export interface SetupOutletContext {
  /** Key of the table selected: table_name */
  tableKey: string | undefined;

  /** Key of the section selected */
  sectionKey: Sections | undefined;

  /** Id of the record selected */
  recordId: string | undefined;

  /** Flag to decide to refrshef the info inside the sidebar */
  refreshSidebar: boolean;

  /** Set method of the flag refreshSidebar */
  setRefreshSidebar: (refreshSidebar: boolean) => void;
}

//###############################################
// DYNAMIC LIST
//###############################################
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

//###############################################
// DYNAMIC FORM
//###############################################
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
  is_textarea?: boolean; //used only in the setup
  label?: string; //used only in the setup
}

export type MetadataFieldStructure = Record<string, BaseFieldInfo>;
