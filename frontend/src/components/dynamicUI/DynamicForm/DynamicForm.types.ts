import type {
  UseFormRegister,
  FieldErrors,
  FieldValues,
} from "react-hook-form";

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

export interface FieldInfo {
  object_name: string;
  record_type_name: string;
  field_name: string;
  field_type: FieldType;
  length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
  reference_object: string | null;
  reference_field: string | null;
  is_editable: 0 | 1;
  is_required: 0 | 1;
  is_primary_key: 0 | 1;
  lookup_filter: string;
  options?: (FieldOptionRadio & FieldOptionLookup)[];
  value: any;
  max_limit_value?: string;
  min_limit_value?: string;

  is_textarea?: boolean; //used only in the setup
  label?: string; //used only in the setup
}

export interface DynamicFormProps {
  /** Fields to show with their structure */
  fields: Record<string, FieldInfo>;

  /** Flag to show or hide the validation */
  validated: boolean;

  /** Function to use on submit */
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;

  /** Key of the selected table */
  tableKey: string;

  /** Collection of errors messages (standard of react-hook-form) */
  errors: FieldErrors<FieldValues>;

  /** Function to register the form element (standard of react-hook-form) */
  register: UseFormRegister<FieldValues>;

  /** Flag to understand if the form is and edit or new record form */
  isNewForm: boolean;

  /** Flag to understand if is in view or edit mode */
  isEdit: boolean;
}

export type FieldRenderFunction = (
  key: string,
  info: FieldInfo,
) => React.ReactElement;

export interface DynamicImageProps {
  /** Fields key */
  fieldKey: string;

  /** Object with all the information of the field */
  info: FieldInfo;

  /** Flag to understand if the form is and edit or new record form */
  isNewForm: boolean;

  /** Flag to understand if is in view or edit mode */
  isEdit: boolean;

  /** Collection of errors messages (standard of react-hook-form) */
  errors: FieldErrors<FieldValues>;

  /** Function to register the form element (standard of react-hook-form) */
  register: UseFormRegister<FieldValues>;
}
