import { FieldDefinition, RecordListStructure } from "types/list.types";

export interface DynamicRecordsListProps {
  /** Data structure of the record retrieved on the DB */
  data: RecordListStructure;

  /** Table currently selected */
  redirectKey: string;

  /** Path to use in case of redirect */
  pathRedirect?: string;
}

export interface RecordCellProps {
  fieldValue: RecordListStructure["records"][number][string]; // this syntax access to records, takes a random element (number) e take a random key (string)
  fieldType: FieldDefinition["field_type"];
  isPrimaryKey: boolean;
  onNavigate: (val: string) => void;
  formatterDate: Record<"date" | "datetime-local", Intl.DateTimeFormat>;
}
