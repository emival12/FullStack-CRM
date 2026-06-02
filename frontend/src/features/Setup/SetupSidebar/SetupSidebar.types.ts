import { Sections } from "types/routing.types";
import { SidebarItem } from "features/TablesSidebar/TablesSidebar.types";

export interface SetupSidebarProps {
  /** Key of the table selected */
  tableKey: string | undefined;

  /** Key of the section selected */
  sectionKey: Sections | undefined;

  /** Set method of the flag refreshSidebar */
  refreshSidebar: boolean;
}

export type PlainSidebarStructure = SidebarItem[];
