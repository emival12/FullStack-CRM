import { useCallback, useState } from "react";

import client from "@/api/client";
import { ApiError } from "@/api/types";

export const useApiMutation = <TBody, TResp>(
  path: string,
  method: "post" | "put" | "delete",
) => {
  const [data, setData] = useState<TResp>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError>();

  const mutate = useCallback(
    async (body: TBody): Promise<TResp> => {
      setLoading(true);
      setError(undefined);
      try {
        const res = await client[method]<TResp>(path, body);
        setData(res.data);
        return res.data;
      } catch (err) {
        setError(err as ApiError);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [path, method],
  );

  return { mutate, data, loading, error };
};
