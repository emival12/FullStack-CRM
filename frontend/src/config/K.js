export const API_BASE_URL = "http://127.0.0.1:8000/api";
export const PATH_DATABASE = "/database";
export const PATH_IMPORT = "/import";
export const PATH_SETUP = "/setup";

export const PATH_DELETE = "/Delete";
export const PATH_UPDATE = "/Update";
export const PATH_INSERT = "/insert";

export const ERROR_MISSING_TABLE = (data) => `Table '${data}' not found`;
export const ERROR_MISSING_RECORD = (data) => `Record '${data}' not found`;
