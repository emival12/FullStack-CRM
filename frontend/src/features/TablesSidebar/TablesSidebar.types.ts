import { ObjectDefinitionItem } from "@/types/object.types";

export interface TablesSidebarProps {
  /** Table currently selected */
  tableKey: string | undefined;
}

export interface SidebarItem extends ObjectDefinitionItem {
  type: "leaf";
  record_type_name: string;
  is_active: 0 | 1;
}

export interface SidebarGroup {
  type: "group";
  label: string;
  children: SidebarItem[];
}

export type SidebarEntry = SidebarItem | SidebarGroup;
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
