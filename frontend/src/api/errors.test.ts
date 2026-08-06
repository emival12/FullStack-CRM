import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import { parseApiError } from "./errors";

describe("parseApiError", () => {
  it.each([null, undefined, new Error("Generic_Error"), {}])(
    "returns UNKNOWN_ERROR when the input is not an axios error - %#",
    (error) => {
      const apiError = parseApiError(error);
      expect(apiError).toStrictEqual({
        status: 0,
        kind: "system",
        errorCode: "UNKNOWN_ERROR",
        errorData: undefined,
      });
    },
  );

  it("returns NETWORK_ERROR when the input doesn't reach the server", () => {
    const apiError = parseApiError(new AxiosError("fake_axios_error"));
    expect(apiError).toStrictEqual({
      status: 0,
      kind: "system",
      errorCode: "NETWORK_ERROR",
      errorData: undefined,
    });
  });

  const createAxiosError = (status: number, detail: unknown): AxiosError => {
    return new AxiosError("fake_axios_error", undefined, undefined, undefined, {
      status: status,
      statusText: "",
      data: { detail: detail },
      headers: {},
      config: {},
    } as AxiosResponse);
  };
  it.each([
    [
      500,
      {
        error_code: "ADMIN_ERROR",
        kind: "system",
        error_data: { object_name: "test_data" },
      },
      {
        status: 500,
        kind: "system",
        errorCode: "ADMIN_ERROR",
        errorData: { object_name: "test_data" },
      },
    ],
    [
      404,
      {
        error_code: "IMAGE_NOT_FOUND",
        kind: "business_feature",
        error_data: { object_name: "test_data" },
      },
      {
        status: 404,
        kind: "business_feature",
        errorCode: "IMAGE_NOT_FOUND",
        errorData: { object_name: "test_data" },
      },
    ],
    [
      401,
      {
        error_code: "INVALID_SESSION",
        kind: "business_shared",
        error_data: { object_name: "test_data" },
      },
      {
        status: 401,
        kind: "business_shared",
        errorCode: "INVALID_SESSION",
        errorData: { object_name: "test_data" },
      },
    ],
  ])(
    "maps status, error_code and kind from a well-formed detail - %#",
    (status, detail, expected) => {
      const apiError = parseApiError(createAxiosError(status, detail));
      expect(apiError).toStrictEqual(expected);
    },
  );

  it("normalizes a null error_data to undefined", () => {
    const apiError = parseApiError(
      createAxiosError(500, {
        error_code: "ADMIN_ERROR",
        kind: "system",
        error_data: null,
      }),
    );
    expect(apiError).toStrictEqual({
      status: 500,
      kind: "system",
      errorCode: "ADMIN_ERROR",
      errorData: undefined,
    });
  });

  it.each([
    [null],
    [
      {
        error_code: 10,
        kind: "system",
        error_data: null,
      },
    ],
    [
      {
        error_code: "ADMIN_ERROR",
        kind: "system",
        error_data: 10,
      },
    ],
    [
      {
        error_code: "ADMIN_ERROR",
        kind: "system",
      },
    ],
    [
      {
        error_code: "ADMIN_ERROR",
        kind: "not_existing_kind",
        error_data: null,
      },
    ],
  ])(
    "returns RUNTIME_ERROR when the error is not in the form of error handled by the server - %#",
    (detail) => {
      const apiError = parseApiError(createAxiosError(500, detail));
      expect(apiError).toStrictEqual({
        status: 500,
        kind: "system",
        errorCode: "RUNTIME_ERROR",
        errorData: undefined,
      });
    },
  );
});
