import { MetadataFieldStructure } from "@/types/field.types";
import { RelatedListStructure } from "@/types/list.types";

export interface DataRecordStructure {
  primary_key_name: string;
  field_structure: MetadataFieldStructure;
  related_list: RelatedListStructure[];
}
