import type { FieldDefinition, RecordListStructure } from "commot.types";

export interface DynamicRecordsListProps {
  /** Data structure of the record retrieved on the DB */
  data: RecordListStructure;

  /** Table currently selected */
  redirectKey: string;

  /** Path to use in case of redirect */
  pathRedirect?: string;
}

export interface RecordCellProps {
  fieldValue: RecordListStructure["records"][number][string]; // accedi a records e prendi un valore qualsiasi dell'array (number) e prendi una chiave qualsiasi (string)
  fieldType: FieldDefinition["field_type"];
  isPrimaryKey: boolean;
  onNavigate: (val: string) => void;
}

export type FormatDateSimpleFunction = (
  fieldValue: RecordListStructure["records"][number][string],
  fieldType: FieldDefinition["field_type"],
) => string | undefined;
