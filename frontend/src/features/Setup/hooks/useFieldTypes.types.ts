import {
  FieldOptionLookup,
  FieldOptionRadio,
  FieldType,
  MetadataFieldStructure,
} from "@/types/field.types";
import { ObjectDefinitionItem } from "@/types/object.types";

type StructureOptions = Record<string, string[]>;
export interface NewSetupFieldStructure {
  field_types: Record<string, FieldType>;
  lookup_options: ObjectDefinitionItem[];
  fields_options: StructureOptions;
  fields_options_rollup: StructureOptions;
  rt_options: StructureOptions;
}

export type GenerateOptionsFunc = <T>(
  options: Record<string, string>,
  key_label: string,
  value_label: string,
) => T[];

export type NormalizeInputOptionsFunc = (
  options: ObjectDefinitionItem[] | string[],
) => Record<string, string>;

export type GenerateLookupOptionsFunc = (
  options: ObjectDefinitionItem[] | string[],
) => FieldOptionLookup[];

export type GenerateRadioOptionsFunc = (
  options: ObjectDefinitionItem[] | string[],
) => FieldOptionRadio[];

export type CloneAndAddOptionsFunc = (
  structureObject: MetadataFieldStructure,
  fieldName: string,
  options: (FieldOptionRadio | FieldOptionLookup)[],
) => MetadataFieldStructure;

export type SortDictFunc = (
  dict: MetadataFieldStructure,
) => MetadataFieldStructure;

export type GetMetadataWithDependentOptionsFunc = (
  fieldType: FieldType,
  referenceObject: string,
  fieldName: string,
  target?: MetadataFieldStructure | undefined,
) => MetadataFieldStructure | undefined;

export type GetSpecificFormByTypeFunc = (
  fieldType: FieldType,
) => MetadataFieldStructure | undefined;

export type ComputeDependentFormFunc = (
  databaseMetadata: NewSetupFieldStructure,
  target: MetadataFieldStructure,
  fieldName: string,
  fieldType: FieldType,
  referenceObject: string,
) => MetadataFieldStructure | undefined;
