import axios from "axios";

import {
  ERROR_EXPIRED_SESSION,
  EVENT_EXPIRED_SESSION,
  USER_TOKEN_NAME,
} from "@/config/K";

import { ENDPOINTS } from "./endpoints";
import { parseApiError } from "./errors";

const client = axios.create({ baseURL: "/api" });
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(USER_TOKEN_NAME);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => {
    response.data = response.data?.data;
    return response;
  },
  (error) => {
    const apiError = parseApiError(error);
    if (
      apiError.errorCode === ERROR_EXPIRED_SESSION &&
      localStorage.getItem(USER_TOKEN_NAME) && // Send only 1 event of session expired
      error.config?.url !== ENDPOINTS.auth.currentUser // Avoid to send the event for this specific endpoint because is not needed the ToastErrorMsg
    ) {
      window.dispatchEvent(
        new CustomEvent(EVENT_EXPIRED_SESSION, { detail: apiError }),
      );
    }

    return Promise.reject(apiError);
  },
);

export default client;
