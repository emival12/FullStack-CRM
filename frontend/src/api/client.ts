import axios from "axios";

import { parseApiError } from "./errors";

const client = axios.create({ baseURL: "/api" });
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("userToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => {
    response.data = response.data?.data;
    return response;
  },
  (error) => {
    return Promise.reject(parseApiError(error));
  },
);

export default client;
