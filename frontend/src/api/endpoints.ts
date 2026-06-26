export const DIRECT_ENDPOINTS = {
  assets: {
    image: (img: string) => `/api/images/${img}`,
  },
} as const;

export const ENDPOINTS = {
  config: {
    translations: (lang: string) => `/translations/${lang}`,
  },
  crud: {
    create: "/insert",
    update: "/update",
    delete: "/delete",
  },
  auth: {
    login: "/login",
    checkConnection: "/check_connection",
  },
  sidebar: {
    tables: "/tables",
    plainTables: "/plain_tables",
  },
  records: {
    recordsList: (tableKey: string) => `/${tableKey}`,
    newRecord: (tableKey: string) => `/${tableKey}/new-record`,
    recordDetail: (tableKey: string, recordId: string) =>
      `/${tableKey}/record?${new URLSearchParams({ record_id: recordId }).toString()}`,
  },
  import: {
    import: "/import",
    upload: "/import/upload",
  },
  setup: {
    object: {
      exists: (tableKey: string) =>
        `/setup/check-table-existence?${new URLSearchParams({ table_name: tableKey }).toString()}`,
      create: "/setup/new-object",
      definition: (tableKey: string) => `/setup/${tableKey}`,
      update: "/setup/home/update",
      delete: "/setup/home/delete",
    },
    fields: {
      recordsList: (tableKey: string) => `/setup/${tableKey}/fields`,
      newStructure: "/setup/field/new/structure",
      create: (tableKey: string) => `/setup/${tableKey}/field/new`,
      record: (tableKey: string, recordId: string) =>
        `/setup/${tableKey}/fields/${recordId}`,
      delete: "/setup/fields/delete",
    },
  },
} as const;
