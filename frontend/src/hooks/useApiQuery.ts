import { useCallback, useEffect, useState } from "react";

import client from "@/api/client";
import { ApiError } from "@/api/types";

export const useApiQuery = <T>(
  path: string,
  options?: { enabled?: boolean; refetchKey?: string | number | boolean },
) => {
  const enabled = options?.enabled ?? true;
  const refetchKey = options?.refetchKey;

  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<ApiError>();

  const refetch = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);

    client
      .get<T>(path)
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    return refetch();
  }, [refetch, enabled, refetchKey]);

  return { data, loading, error, refetch };
};
