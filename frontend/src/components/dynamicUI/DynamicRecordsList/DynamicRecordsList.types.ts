export interface FieldDefinition {
  key: string;
  label: string;
  field_type: string;
}

export interface RecordListStructure {
  fields: FieldDefinition[];
  primary_key_name: string;
  records: Record<string, any>[];
}

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
