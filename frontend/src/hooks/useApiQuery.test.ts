// @vitest-environment jsdom
// this comment enable the react-dom only for this file

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import client from "@/api/client";
import { ApiError } from "@/api/types";

import { useApiQuery } from "./useApiQuery";

vi.mock("@/api/client", () => ({ default: { get: vi.fn() } })); // When is imported api/client instead of taking the real file use the value bassed by this function

describe("useApiQuery", () => {
  afterEach(() => {
    cleanup(); //remove everything from the body of the document
    vi.resetAllMocks(); // remove the history of all th calls and remove also the mocked data
  });

  it("returns the response data and stops loading when the request succeeds", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { id: 1 } }); //when is called client.get return this data

    const { result } = renderHook(() =>
      useApiQuery<{ id: number }>("/whatever"),
    );

    expect(client.get).toHaveBeenCalledTimes(1);
    expect(client.get).toHaveBeenCalledWith("/whatever");
    expect(result.current.loading).toEqual(true);
    await waitFor(() => {
      expect(result.current.loading).toEqual(false);
      expect(result.current.data).toEqual({ id: 1 });
    });
  });

  it("returns the error and leaves data empty when the request fails", async () => {
    const apiError: ApiError = {
      status: 0,
      kind: "system",
      errorCode: "ADMIN_ERROR",
      errorData: undefined,
    };
    vi.mocked(client.get).mockRejectedValue(apiError);

    const { result } = renderHook(() =>
      useApiQuery<{ id: number }>("/whatever"),
    );

    expect(result.current.loading).toEqual(true);
    await waitFor(() => {
      expect(result.current.loading).toEqual(false);
      expect(result.current.data).toEqual(undefined);
      expect(result.current.error).toBe(apiError);
    });
  });

  it("does not call the API and is not loading when disabled", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { id: 1 } });

    const { result } = renderHook(() =>
      useApiQuery<{ id: number }>("/whatever", { enabled: false }),
    );

    expect(result.current.loading).toEqual(false);
    expect(result.current.data).toEqual(undefined);
    expect(client.get).not.toHaveBeenCalled();
  });

  it("refetches and returns the new data when refetchKey changes", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { id: 1 } });

    const { result, rerender } = renderHook(
      ({ key }) =>
        useApiQuery<{ id: number }>("/whatever", {
          refetchKey: key,
        }),
      { initialProps: { key: "test" } },
    );

    expect(result.current.loading).toEqual(true);
    await waitFor(() => {
      expect(result.current.loading).toEqual(false);
      expect(result.current.data).toEqual({ id: 1 });
    });

    vi.mocked(client.get).mockResolvedValue({ data: { id: 2 } });

    rerender({ key: "test_2" }); //changes the props
    expect(result.current.loading).toEqual(true);
    await waitFor(() => {
      expect(result.current.loading).toEqual(false);
      expect(result.current.data).toEqual({ id: 2 });
    });
  });

  it("refetches manually and returns the new data", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { id: 1 } });

    const { result } = renderHook(() =>
      useApiQuery<{ id: number }>("/whatever", {
        enabled: false,
      }),
    );

    expect(result.current.loading).toEqual(false);
    expect(result.current.data).toEqual(undefined);
    expect(client.get).not.toHaveBeenCalled();

    act(() => {
      // runs the callback, then flushes all pending state updates and effects
      result.current.refetch();
    });
    expect(result.current.loading).toEqual(true);
    await waitFor(() => {
      expect(result.current.loading).toEqual(false);
      expect(result.current.data).toEqual({ id: 1 });
    });
  });

  it("clears the previous error when a manual refetch succeeds", async () => {
    const apiError: ApiError = {
      status: 0,
      kind: "system",
      errorCode: "ADMIN_ERROR",
      errorData: undefined,
    };
    vi.mocked(client.get).mockRejectedValue(apiError);

    const { result } = renderHook(() =>
      useApiQuery<{ id: number }>("/whatever"),
    );

    expect(result.current.loading).toEqual(true);
    await waitFor(() => {
      expect(result.current.loading).toEqual(false);
      expect(result.current.data).toEqual(undefined);
      expect(result.current.error).toBe(apiError);
    });

    vi.mocked(client.get).mockResolvedValue({ data: { id: 1 } });
    act(() => {
      result.current.refetch();
    });
    expect(result.current.loading).toEqual(true);
    expect(result.current.error).toEqual(undefined);
    await waitFor(() => {
      expect(result.current.loading).toEqual(false);
      expect(result.current.data).toEqual({ id: 1 });
    });
  });

  it("ignores a stale response that arrives after a newer one", async () => {
    let resolveFirst!: (value: unknown) => void;
    const firstResponse = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    vi.mocked(client.get)
      .mockReturnValueOnce(firstResponse)
      .mockResolvedValueOnce({ data: { id: 2 } });

    const { result, rerender } = renderHook(
      ({ key }) =>
        useApiQuery<{ id: number }>("/whatever", {
          refetchKey: key,
        }),
      { initialProps: { key: "test" } },
    );
    rerender({ key: "test_2" });

    expect(result.current.loading).toEqual(true);
    await waitFor(() => {
      expect(result.current.loading).toEqual(false);
      expect(result.current.data).toEqual({ id: 2 });
    });

    await act(async () => {
      resolveFirst({ data: { id: 1 } });
    });
    expect(result.current.data).toEqual({ id: 2 });
  });
});
