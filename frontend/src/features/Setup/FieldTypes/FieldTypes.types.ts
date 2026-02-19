import {
  FieldOptionLookup,
  FieldOptionRadio,
  FieldType,
  MetadataFieldStructure,
} from "commot.types";

export interface LookupOptionItem {
  object_label: string;
  object_name: string;
  category: string;
  sort_order: number;
  is_system_object: 0 | 1;
  is_single_record_type: 0 | 1;
  key: string;
  label: string;
}

export type StructureOptions = Record<string, string[]>;
export interface NewSetupFieldStructure {
  field_types: Record<string, FieldType>;
  lookup_options: LookupOptionItem[];
  fields_options: StructureOptions;
  fields_options_rollup: StructureOptions;
  rt_options: StructureOptions;
}

export type GetSpecificFormByTypeFunc = (
  fieldType: FieldType,
) => MetadataFieldStructure | null;

export type UpdateDependentOptionsFunc = (
  fieldType: FieldType,
  referenceObject: string,
  fieldName: string,
  target?: MetadataFieldStructure | undefined,
) => void;

export type CloneAndAddOptionsFunc = (
  structureObject: MetadataFieldStructure,
  fieldName: string,
  options: (FieldOptionRadio | FieldOptionLookup)[],
) => MetadataFieldStructure;

export type GenerateOptionsFunc = (
  options: StructureOptions[string] | LookupOptionItem[],
  usePicklistOptionFormat?: boolean,
) => (FieldOptionRadio | FieldOptionLookup)[] | undefined;

export type MergeDictFunc = (
  dict1: MetadataFieldStructure,
  dict2: MetadataFieldStructure,
) => MetadataFieldStructure;

export type SortDictFunc = (
  dict: MetadataFieldStructure,
) => MetadataFieldStructure;
