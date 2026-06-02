export interface ObjectDefinitionItem {
  object_label: string;
  object_name: string;
  category: string;
  sort_order: number;
  is_system_object: 0 | 1;
  is_single_record_type: 0 | 1;
  key: string;
  label: string;
}
