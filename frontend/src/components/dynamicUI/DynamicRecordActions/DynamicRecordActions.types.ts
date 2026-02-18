import type { UseFormReset, FieldValues } from "react-hook-form";
import type { ToastConfig } from "@/commot.types.js";

export interface DynamicRecordActionsProps {
  /** Set method of the flag Loading */
  setLoading: (loading: boolean) => void;

  /** Label used for the first button near the delete (generally is New or Edit) */
  editLabel: string;

  /** Flag to understand if is in edit or in view mode */
  isEdit: boolean;

  /** Set method of the flag isEdit  */
  setIsEdit: (isEdit: boolean) => void;

  /** Function used to refresh the form (standard of react-hook-form) */
  reset: UseFormReset<FieldValues>;

  /** Object with all the information to show the toast in case of error */
  setToastConfig: (toastConfig: ToastConfig) => void;

  /** Flag to decide if the deleted button is needed */
  hasDeleteButton: boolean;

  /** Path used in the API call */
  pathAPI?: string;

  /** Payload used in the API call */
  payloadAPI?: Record<string, any>;

  /** Path used to redirect after the API success */
  redirectAPI?: string;

  /** Extra function with some extra actions to perform on delete */
  extraActionOnDelete?: () => void;

  /** Variable with an optional text to be shown near the Delete/New buttons */
  extraDescription?: string;
}
