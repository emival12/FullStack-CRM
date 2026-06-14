import type {
  FieldErrors,
  FieldValues,
  UseFormRegister,
} from "react-hook-form";

import { BaseFieldInfo, MetadataFieldStructure } from "@/types/field.types";

export type Editability = "all" | "byField" | "none";

export interface DynamicFormProps {
  /** Fields to show with their structure */
  fields: MetadataFieldStructure;

  /** Function to use on submit */
  onSubmit: React.SubmitEventHandler<HTMLFormElement>;

  /** Key of the selected table */
  tableKey?: string;

  /** Collection of errors messages (standard of react-hook-form) */
  errors: FieldErrors<FieldValues>;

  /** Function to register the form element (standard of react-hook-form) */
  register: UseFormRegister<FieldValues>;

  /** Editability policy applied to the fields */
  editability: Editability;
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

  /** Collection of errors messages (standard of react-hook-form) */
  errors: FieldErrors<FieldValues>;

  /** Function to register the form element (standard of react-hook-form) */
  register: UseFormRegister<FieldValues>;

  /** Editability policy applied to the fields */
  editability: Editability;
}
