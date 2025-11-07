export const SECTIONS = [
  { key: "home", label: "Home" },
  { key: "fields", label: "Campi" },
  { key: "layout", label: "Layout" },
  { key: "record_types", label: "Record Type" },
  { key: "related_lists", label: "Related List" },
];

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
        option_key: "VARCHAR",
      },
      {
        option_label: "Auto number",
        option_key: "SMALLINT",
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
