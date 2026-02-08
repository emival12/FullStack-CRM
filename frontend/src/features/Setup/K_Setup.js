import {
  AGGREGATION_FUNCTION_BASE,
  CATEGORY_BASE,
  FIELD_NAME_BASE,
  FIELD_TYPE_BASE,
  ID_FIELD_NAME_BASE,
  ID_FIELD_TYPE_BASE,
  IS_ACTIVE_BASE,
  IS_EDITABLE_BASE,
  IS_REQUIRED_BASE,
  IS_VISIBLE_BASE,
  LENGTH_BASE,
  LOOKUP_FILTER_BASE,
  NUMERIC_PRECISION_BASE,
  NUMERIC_SCALE_BASE,
  OBJECT_LABEL_BASE,
  OBJECT_NAME_BASE,
  OPTION_VALUES_BASE,
  REFERENCE_FIELD_BASE,
  REFERENCE_OBJECT_BASE,
  REFERENCE_OBJECT_RECORD_TYPE_BASE,
  SORT_ORDER_BASE,
} from "../../config/K_FieldBaseStructure";

export const Sections = {
  home: "home",
  fields: "fields",
  layout: "layout",
  record_types: "record_types",
  related_lists: "related_lists",
};

export const SECTIONS = [
  { key: Sections.home, label: "Home" },
  { key: Sections.fields, label: "Campi" },
  { key: Sections.layout, label: "Layout" },
  { key: Sections.record_types, label: "Record Type" },
  { key: Sections.related_lists, label: "Related List" },
];

//Structure to edit a new table
export const HOME_OBJECT_FIELD_STRUCTURE = {
  object_label: OBJECT_LABEL_BASE,
  object_name: OBJECT_NAME_BASE,
  category: CATEGORY_BASE,
  sort_order: SORT_ORDER_BASE,
};

//Structure to create a new table
export const NEW_OBJECT_FIELD_STRUCTURE = {
  ...HOME_OBJECT_FIELD_STRUCTURE,
  id_field_name: ID_FIELD_NAME_BASE,
  id_field_type: ID_FIELD_TYPE_BASE,
};

//Structure to create a new field
export const NEW_FIELD_OBJECT_STRUCTURE = {
  field_type: FIELD_TYPE_BASE,
};

export const BASE_FIELD_OBJECT_STRUCTURE = {
  field_name: FIELD_NAME_BASE,
  is_active: IS_ACTIVE_BASE,
  is_visible: IS_VISIBLE_BASE,
  is_editable: IS_EDITABLE_BASE,
  is_required: IS_REQUIRED_BASE,
};

export const NEW_TEXT_FIELD_OBJECT_STRUCTURE = {
  ...BASE_FIELD_OBJECT_STRUCTURE,
  length: LENGTH_BASE,
};

export const NEW_NUMBER_FIELD_OBJECT_STRUCTURE = {
  ...BASE_FIELD_OBJECT_STRUCTURE,
  numeric_precision: NUMERIC_PRECISION_BASE,
  numeric_scale: NUMERIC_SCALE_BASE,
};

export const NEW_LOOKUP_FIELD_OBJECT_STRUCTURE = {
  ...BASE_FIELD_OBJECT_STRUCTURE,
  reference_object: REFERENCE_OBJECT_BASE,
  reference_field: REFERENCE_FIELD_BASE,
  lookup_filter: LOOKUP_FILTER_BASE,
};

export const NEW_PICKLIST_FIELD_OBJECT_STRUCTURE = {
  ...BASE_FIELD_OBJECT_STRUCTURE,
  reference_object: REFERENCE_OBJECT_BASE,
  reference_field: REFERENCE_FIELD_BASE,
};

export const NEW_ROLLUP_FIELD_OBJECT_STRUCTURE = {
  ...BASE_FIELD_OBJECT_STRUCTURE,
  reference_object: REFERENCE_OBJECT_BASE,
  reference_object_record_type: REFERENCE_OBJECT_RECORD_TYPE_BASE,
  reference_field: REFERENCE_FIELD_BASE,
  aggregation_function: AGGREGATION_FUNCTION_BASE,
};

export const NEW_RADIO_FIELD_OBJECT_STRUCTURE = {
  ...BASE_FIELD_OBJECT_STRUCTURE,
  options_values: OPTION_VALUES_BASE,
};

export const NEW_CHECKBOX_FIELD_OBJECT_STRUCTURE = {
  ...BASE_FIELD_OBJECT_STRUCTURE,
};

export const NEW_DATE_FIELD_OBJECT_STRUCTURE = {
  ...BASE_FIELD_OBJECT_STRUCTURE,
};

// this is used only on the primary key (the autonumber type is not available)
export const FULL_AUTO_NUMBER_FIELD_STRUCTURE = {
  field_name: {
    ...FIELD_NAME_BASE,
    is_editable: 0,
  },
};
