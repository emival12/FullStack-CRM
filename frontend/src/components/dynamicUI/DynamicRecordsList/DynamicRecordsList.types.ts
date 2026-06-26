import { FieldDefinition, RecordListStructure } from "@/types/list.types";

export interface DynamicRecordsListProps {
  /** Data structure of the record retrieved on the DB */
  data: RecordListStructure;

  /** Returns the navigation path for a record given its primary key */
  getRecordPath: (id: string) => string;
}

export interface RecordCellProps {
  fieldValue: RecordListStructure["records"][number][string]; // this syntax access to records, takes a random element (number) e take a random key (string)
  fieldType: FieldDefinition["field_type"];
  isPrimaryKey: boolean;
  onNavigate: (val: string) => void;
  formatterDate: Record<"date" | "datetime-local", Intl.DateTimeFormat>;
}

export type FormatValueFunction = (
  fieldValue: RecordListStructure["records"][number][string],
  fieldType: FieldDefinition["field_type"],
  formatterDate: Record<"date" | "datetime-local", Intl.DateTimeFormat>,
) => string | number | boolean | undefined;
