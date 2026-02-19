import type {
  UseFormRegister,
  FieldErrors,
  FieldValues,
} from "react-hook-form";
import type {
  BaseFieldInfo,
  FieldOptionLookup,
  FieldOptionRadio,
  FieldType,
} from "commot.types";

export interface FieldInfo extends BaseFieldInfo {
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

export type DataFieldStructure = Record<string, FieldInfo>;
export interface DynamicFormProps {
  /** Fields to show with their structure */
  fields: DataFieldStructure;

  /** Flag to show or hide the validation */
  validated: boolean;

  /** Function to use on submit */
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;

  /** Key of the selected table */
  tableKey?: string;

  /** Collection of errors messages (standard of react-hook-form) */
  errors: FieldErrors<FieldValues>;

  /** Function to register the form element (standard of react-hook-form) */
  register: UseFormRegister<FieldValues>;

  /** Flag to understand if the form is and edit or new record form */
  isNewForm?: boolean;

  /** Flag to understand if is in view or edit mode */
  isEdit?: boolean;
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
  isNewForm?: boolean;

  /** Flag to understand if is in view or edit mode */
  isEdit: boolean;

  /** Collection of errors messages (standard of react-hook-form) */
  errors: FieldErrors<FieldValues>;

  /** Function to register the form element (standard of react-hook-form) */
  register: UseFormRegister<FieldValues>;
}

export interface DataRecordStructure {
  primary_key_name: string;
  field_structure: DataFieldStructure;
  related_list: any[]; //TODO FIX
}
