import axios from "axios";

import { type ApiError,ERROR_KINDS } from "./types";

export const parseApiError = (err: unknown): ApiError => {
  if (!axios.isAxiosError(err)) {
    return {
      status: 0,
      kind: "system",
      errorCode: "UNKNOWN_ERROR",
      errorData: undefined,
    };
  }

  if (!err.response) {
    return {
      status: 0,
      kind: "system",
      errorCode: "NETWORK_ERROR",
      errorData: undefined,
    };
  }

  const status = err.response.status;
  const detail = err.response.data?.detail;
  if (
    detail &&
    typeof detail.error_code === "string" &&
    typeof detail.error_data === "object" &&
    ERROR_KINDS.includes(detail.kind)
  ) {
    return {
      status: status,
      kind: detail.kind,
      errorCode: detail.error_code,
      errorData: detail.error_data ?? undefined,
    };
  }

  return {
    status,
    kind: "system",
    errorCode: "RUNTIME_ERROR",
    errorData: undefined,
  };
};
