import { Sections } from "types/routing.types";
import { ObjectDefinitionItem } from "types/object.types";

export interface SetupSidebarProps {
  /** Key of the table selected */
  tableKey: string | undefined;

  /** Key of the section selected */
  sectionKey: Sections | undefined;

  /** Set method of the flag refreshSidebar */
  refreshSidebar: boolean;
}

export type PlainSidebarStructure = ObjectDefinitionItem[];
