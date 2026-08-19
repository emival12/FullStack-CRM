export type ApiResponse<T> = {
  data: T;
};

export const ERROR_KINDS = [
  "system",
  "business_shared",
  "business_feature",
  "business_trigger",
] as const;
type ErrorKind = (typeof ERROR_KINDS)[number];
export type ApiError = {
  // HTTP status code returned by the server - 0 means the request never reached the server
  status: number;

  // Identifier of the type of error
  kind: ErrorKind;

  // Identifier from the backend, e.g. "INPUT_RECORD_ID_NOT_FOUND"
  errorCode: string;

  // Optional context dict from the backend
  errorData: Record<string, unknown> | undefined;
};

export interface CRUDResult {
  result: number;
}
