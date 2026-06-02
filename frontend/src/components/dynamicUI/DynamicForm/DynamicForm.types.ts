import type {
  UseFormRegister,
  FieldErrors,
  FieldValues,
} from "react-hook-form";
import { BaseFieldInfo, MetadataFieldStructure } from "types/field.types";

export interface DynamicFormProps {
  /** Fields to show with their structure */
  fields: MetadataFieldStructure;

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
  info: BaseFieldInfo,
) => React.ReactElement;

export interface DynamicImageProps {
  /** Fields key */
  fieldKey: string;

  /** Object with all the information of the field */
  info: BaseFieldInfo;

  /** Flag to understand if the form is and edit or new record form */
  isNewForm?: boolean;

  /** Flag to understand if is in view or edit mode */
  isEdit: boolean;

  /** Collection of errors messages (standard of react-hook-form) */
  errors: FieldErrors<FieldValues>;

  /** Function to register the form element (standard of react-hook-form) */
  register: UseFormRegister<FieldValues>;
}
