export interface TablesSidebarProps {
  /** Table currently selected */
  tableKey: string | undefined;
}

export interface SidebarItem {
  object_label: string;
  object_name: string;
  record_type_name: string;
  category: string;
  sort_order: number;
  is_system_object: 0 | 1;
  is_single_record_type: 0 | 1;
  key: string;
  label: string;
}

export type SidebarEntry = SidebarItem | Record<string, SidebarEntry[]>;
export type SidebarStructure = Record<string, SidebarEntry[]>;

export interface TablesSidebarAccordionProps {
  /** Contains the data retrieved from the query with the structure of the tabless */
  tablesData: SidebarStructure;

  /** Table currently selected */
  tableKey: string | undefined;

  /** Set method of the change the showSidebar flag */
  toggleSidebar: () => void;
}

export interface TablesSidebarListProps {
  /** Record to show */
  tableItem: SidebarItem;

  /** Table currently selected */
  tableKey: string | undefined;

  /** Set method of the change the showSidebar flag */
  toggleSidebar: () => void;

  /** Name of the field to show in the frontend */
  displayField?: keyof SidebarItem;
}
