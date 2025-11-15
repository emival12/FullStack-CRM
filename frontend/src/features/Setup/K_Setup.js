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
  Object_name: {
    field_type: "text",
    length: 100,
    is_editable: 1,
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
    limit_value: 99999,
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

export const HOME_OBJECT_FIELD_STRUCTURE = {
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
    limit_value: 99999,
  },
};

export const NEW_FIELD_OBJECT_STRUCTURE = {
  Field_type: {
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
    field_type: "text",
    length: 255,
    is_editable: 1,
    is_required: 1,
    order: 2,
  },
};

//numeric_precision;
//numeric_scale;
//reference_object;
//reference_field;
//lookup_filter;
