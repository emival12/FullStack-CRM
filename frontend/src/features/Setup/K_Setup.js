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

//Structure to create a new table
export const NEW_OBJECT_FIELD_STRUCTURE = {
  Object_label: {
    field_type: "text",
    length: 100,
    is_editable: 1,
    is_required: 1,
  },
  Object_name: {
    field_type: "text",
    length: 100,
    is_editable: 0,
    is_required: 1,
  },
  Category: {
    field_type: "text",
    length: 50,
    is_editable: 1,
    is_required: 1,
  },
  Sort_order: {
    field_type: "number",
    numeric_precision: 5,
    numeric_scale: null,
    is_editable: 1,
    is_required: 1,
    max_limit_value: 99999,
    min_limit_value: 1,
  },
  Id_field_name: {
    field_type: "text",
    length: 255,
    is_editable: 1,
    is_required: 1,
  },
  Id_field_type: {
    field_type: "radio",
    length: 255,
    is_editable: 1,
    is_required: 1,
    options: [
      {
        option_label: "Text",
        option_key: "text",
      },
      {
        option_label: "Auto number",
        option_key: "number",
      },
    ],
  },
};

//Structure to edit a new table
export const HOME_OBJECT_FIELD_STRUCTURE = {
  Object_label: {
    field_type: "text",
    length: 100,
    is_editable: 1,
    is_required: 1,
  },
  Object_name: {
    field_type: "text",
    length: 100,
    is_editable: 0,
    is_required: 1,
  },
  Category: {
    field_type: "text",
    length: 50,
    is_editable: 1,
    is_required: 1,
  },
  Sort_order: {
    field_type: "number",
    numeric_precision: 5,
    numeric_scale: null,
    is_editable: 1,
    is_required: 1,
    max_limit_value: 99999,
    min_limit_value: 1,
  },
};

//Structure to create a new field
export const NEW_FIELD_OBJECT_STRUCTURE = {
  field_type: {
    field_type: "radio",
    is_editable: 1,
    is_required: 1,
    options: [],
  },
};

export const BASE_FIELD_OBJECT_STRUCTURE = {
  field_name: {
    field_type: "text",
    length: 255,
    is_editable: 1,
    is_required: 1,
    order: 1,
  },
  is_active: {
    field_type: "checkbox",
    is_editable: 0,
    is_required: 1,
    label: "",
    value: 1,
    order: 97,
  },
  is_visible: {
    field_type: "checkbox",
    is_editable: 0,
    is_required: 1,
    label: "",
    value: 1,
    order: 98,
  },
  is_editable: {
    field_type: "checkbox",
    is_editable: 1,
    is_required: 0,
    label: "",
    value: 1,
    order: 99,
  },
  is_required: {
    field_type: "checkbox",
    is_editable: 1,
    is_required: 0,
    label: "",
    value: 0,
    order: 100,
  },
};

export const NEW_TEXT_FIELD_OBJECT_STRUCTURE = {
  length: {
    field_type: "number",
    numeric_precision: 3,
    numeric_scale: null,
    is_editable: 1,
    is_required: 1,
    max_limit_value: 255,
    min_limit_value: 1,
    order: 2,
  },
};

export const NEW_NUMBER_FIELD_OBJECT_STRUCTURE = {
  numeric_precision: {
    field_type: "number",
    numeric_precision: 2,
    numeric_scale: null,
    is_editable: 1,
    is_required: 1,
    max_limit_value: 18,
    min_limit_value: 1,
    order: 2,
  },
  numeric_scale: {
    field_type: "number",
    numeric_precision: 2,
    numeric_scale: null,
    is_editable: 1,
    is_required: 1,
    max_limit_value: 17,
    min_limit_value: 0,
    order: 3,
  },
};

export const NEW_LOOKUP_FIELD_OBJECT_STRUCTURE = {
  reference_object: {
    field_type: "lookup",
    is_editable: 1,
    is_required: 1,
    options: [],
    order: 2,
  },
  reference_field: {
    field_type: "lookup",
    is_editable: 1,
    is_required: 1,
    options: [],
    order: 3,
  },
  lookup_filter: {
    field_type: "text",
    length: 1000,
    is_editable: 1,
    is_required: 0,
    order: 4,
  },
};

export const NEW_PICKLIST_FIELD_OBJECT_STRUCTURE = {
  reference_object: {
    field_type: "lookup",
    is_editable: 1,
    is_required: 1,
    options: [],
    order: 2,
  },
  reference_field: {
    field_type: "lookup",
    is_editable: 1,
    is_required: 1,
    options: [],
    order: 3,
  },
};

export const NEW_ROLLUP_FIELD_OBJECT_STRUCTURE = {
  reference_object: {
    field_type: "lookup",
    is_editable: 1,
    is_required: 1,
    options: [],
    order: 2,
  },
  reference_object_record_type: {
    field_type: "lookup",
    is_editable: 1,
    is_required: 1,
    options: [],
    order: 3,
  },
  reference_field: {
    field_type: "lookup",
    is_editable: 1,
    is_required: 1,
    options: [],
    order: 4,
  },
  aggregation_function: {
    field_type: "picklist",
    is_editable: 1,
    is_required: 1,
    options: [
      {
        reference_field: "Somma",
        id: "SUM",
      },
      {
        reference_field: "Minimo",
        id: "MIN",
      },
      {
        reference_field: "Massimo",
        id: "MAX",
      },
    ],
    order: 5,
  },
};

export const NEW_RADIO_FIELD_OBJECT_STRUCTURE = {
  options_values: {
    field_type: "text",
    is_textarea: true,
    length: 1000,
    is_editable: 1,
    is_required: 1,
    order: 2,
  },
};

export const NEW_CHECKBOX_FIELD_OBJECT_STRUCTURE = {};

//Structure to create
