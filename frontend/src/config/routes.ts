const PATH_LOGIN = "/login";
const PATH_DATABASE = "/database";
const PATH_SETUP = "/setup";
const PATH_IMPORT = "/import";

export const ROUTES = {
  login: {
    root: PATH_LOGIN,
  },
  database: {
    root: PATH_DATABASE,
    table: (tableKey: string) => `${PATH_DATABASE}/${tableKey}`,
    record: (tableKey: string, recordId: string) =>
      `${PATH_DATABASE}/${tableKey}/${recordId}`,
  },
  setup: {
    root: PATH_SETUP,
    table: (tableKey: string) => `${PATH_SETUP}/${tableKey}`,
    section: (tableKey: string, sectionName: string) =>
      `${PATH_SETUP}/${tableKey}/${sectionName}`,
    record: (tableKey: string, sectionName: string, recordId: string) =>
      `${PATH_SETUP}/${tableKey}/${sectionName}/${recordId}`,
  },
  import: {
    root: PATH_IMPORT,
  },
} as const;
