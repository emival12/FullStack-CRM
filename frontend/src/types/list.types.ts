import { ObjectDefinitionItem } from "./object.types";

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

export interface RelatedListStructure extends RecordListStructure {
  label: string;
  table: ObjectDefinitionItem;
}
