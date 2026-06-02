import { MetadataFieldStructure } from "types/field.types";

export interface SetupFieldStructure {
  object_primary_key_name: string;
  field_type: string;
  primary_key_name: string;
  field_structure: MetadataFieldStructure;
}
