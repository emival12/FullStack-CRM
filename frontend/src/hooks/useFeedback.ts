import { useCallback } from "react";

import { ApiError } from "api/types";
import { useToast } from "context/Toast/Toast";
import { useLabels } from "context/Label/Label";

export const useFeedback = () => {
  const { showToast } = useToast();
  const { getLabel } = useLabels();

  const getErrorMessage = useCallback(
    (apiErr: ApiError, featurePrefix: string) => {
      const prefix =
        apiErr.kind === "system" || apiErr.kind === "business_shared"
          ? "COMMON"
          : featurePrefix;
      return getLabel(`${prefix}.${apiErr.errorCode}`, apiErr.errorData);
    },
    [getLabel],
  );

  const showErrorToast = useCallback(
    (apiErr: ApiError, featurePrefix: string) => {
      const errTitle = getLabel("TOAST.ERROR_TITLE");
      const errMessage = getErrorMessage(apiErr, featurePrefix);

      showToast("error", errMessage, errTitle);
    },
    [getLabel, getErrorMessage, showToast],
  );

  const showSuccessToast = useCallback(
    (messageKey?: string) => {
      const title = getLabel("TOAST.SUCCESS_TITLE");
      const message = getLabel(messageKey ?? "TOAST.SUCCESS_BODY");

      showToast("success", message, title);
    },
    [getLabel, showToast],
  );

  return { getErrorMessage, showErrorToast, showSuccessToast };
};
