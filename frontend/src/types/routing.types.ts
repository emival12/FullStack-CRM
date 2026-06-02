//###############################################
// DATABASE
//###############################################
export interface DatabaseOutletContext {
  /** Key of the table selected: table_name + table_record_type_name */
  tableKey: string;

  /** Id of the record selected */
  recordId: string | undefined;
}

//###############################################
// SETUP
//###############################################
export enum Sections {
  HOME = "home",
  FIELDS = "fields",
  LAYOUT = "layout",
  RECORD_TYPES = "record_types",
  RELATED_LISTS = "related_lists",
}

export interface SetupOutletContext {
  /** Key of the table selected: table_name */
  tableKey: string | undefined;

  /** Key of the section selected */
  sectionKey: Sections | undefined;

  /** Id of the record selected */
  recordId: string | undefined;

  /** Flag to decide to refrshef the info inside the sidebar */
  refreshSidebar: boolean;

  /** Set method of the flag refreshSidebar */
  setRefreshSidebar: (refreshSidebar: boolean) => void;
}
