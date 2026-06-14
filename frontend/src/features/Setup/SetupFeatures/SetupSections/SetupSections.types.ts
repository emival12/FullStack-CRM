import { Sections } from "@/types/routing.types";

export interface SetupSectionBaseProps {
  /** Key of the table selected: table_name */
  tableKey: string | undefined;

  /** Key of the section selected */
  sectionKey: Sections | undefined;
}

export interface SetupSectionCompleteProps extends SetupSectionBaseProps {
  /** Key of the record selected */
  recordId: string | undefined;
}
