// SINGLE FIELDS FOR MASSIVE IMPORT
export const OPERTION_TYPE_BASE = (Operations) => {
  return {
    field_name: "operation_type",
    field_type: "lookup",
    is_editable: 1,
    is_required: 1,
    options: [
      {
        reference_field: "Insert",
        id: Operations.insert,
      },
      {
        reference_field: "Update",
        id: Operations.update,
      },
    ],
    value: Operations.insert,
    order: 1,
  };
};

export const OBJECT_NAME_MASSIVE_IMPORT_BASE = {
  field_name: "object_name",
  field_type: "lookup",
  is_editable: 1,
  is_required: 1,
  options: [],
  order: 1,
};

// SINGLE FIELDS FOR OBJECT CREATION
export const OBJECT_LABEL_BASE = {
  field_name: "object_label",
  field_type: "text",
  length: 100,
  is_editable: 1,
  is_required: 1,
};

export const OBJECT_NAME_BASE = {
  field_name: "object_name",
  field_type: "text",
  length: 100,
  is_editable: 0,
  is_required: 1,
};

export const CATEGORY_BASE = {
  field_name: "category",
  field_type: "text",
  length: 50,
  is_editable: 1,
  is_required: 1,
};

export const SORT_ORDER_BASE = {
  field_name: "sort_order",
  field_type: "number",
  numeric_precision: 5,
  numeric_scale: null,
  is_editable: 1,
  is_required: 1,
  max_limit_value: 99999,
  min_limit_value: 1,
};

export const ID_FIELD_NAME_BASE = {
  field_name: "id_field_name",
  field_type: "text",
  length: 255,
  is_editable: 1,
  is_required: 1,
};

export const ID_FIELD_TYPE_BASE = {
  field_name: "id_field_type",
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
      option_key: "auto_number",
    },
  ],
};

// SINGLE FIELDS FOR FIELD CREATION
export const FIELD_TYPE_BASE = {
  field_name: "field_type",
  field_type: "radio",
  is_editable: 1,
  is_required: 1,
  options: [],
};

export const FIELD_NAME_BASE = {
  field_name: "field_name",
  field_type: "text",
  length: 255,
  is_editable: 1,
  is_required: 1,
  order: 1,
  is_primary_key: 1,
};

export const IS_ACTIVE_BASE = {
  field_name: "is_active",
  field_type: "checkbox",
  is_editable: 0,
  is_required: 1,
  label: "",
  value: 1,
  order: 97,
};

export const IS_VISIBLE_BASE = {
  field_name: "is_visible",
  field_type: "checkbox",
  is_editable: 0,
  is_required: 1,
  label: "",
  value: 1,
  order: 98,
};

export const IS_EDITABLE_BASE = {
  field_name: "is_editable",
  field_type: "checkbox",
  is_editable: 1,
  is_required: 0,
  label: "",
  value: 1,
  order: 99,
};

export const IS_REQUIRED_BASE = {
  field_name: "is_required",
  field_type: "checkbox",
  is_editable: 1,
  is_required: 0,
  label: "",
  value: 0,
  order: 100,
};

export const LENGTH_BASE = {
  field_name: "length",
  field_type: "number",
  numeric_precision: 3,
  numeric_scale: null,
  is_editable: 1,
  is_required: 1,
  max_limit_value: 255,
  min_limit_value: 1,
  order: 2,
};

export const NUMERIC_PRECISION_BASE = {
  field_name: "numeric_precision",
  field_type: "number",
  numeric_precision: 2,
  numeric_scale: null,
  is_editable: 1,
  is_required: 1,
  max_limit_value: 18,
  min_limit_value: 1,
  order: 2,
};

export const NUMERIC_SCALE_BASE = {
  field_name: "numeric_scale",
  field_type: "number",
  numeric_precision: 2,
  numeric_scale: null,
  is_editable: 1,
  is_required: 1,
  max_limit_value: 17,
  min_limit_value: 0,
  order: 3,
};

export const REFERENCE_OBJECT_BASE = {
  field_name: "reference_object",
  field_type: "lookup",
  is_editable: 1,
  is_required: 1,
  options: [],
  order: 2,
};

export const REFERENCE_OBJECT_RECORD_TYPE_BASE = {
  field_name: "reference_object_record_type",
  field_type: "lookup",
  is_editable: 1,
  is_required: 1,
  options: [],
  order: 3,
};

export const REFERENCE_FIELD_BASE = {
  field_name: "reference_field",
  field_type: "lookup",
  is_editable: 1,
  is_required: 1,
  options: [],
  order: 3,
};

export const LOOKUP_FILTER_BASE = {
  field_name: "lookup_filter",
  field_type: "text",
  length: 1000,
  is_editable: 1,
  is_required: 0,
  order: 4,
};

export const AGGREGATION_FUNCTION_BASE = {
  field_name: "aggregation_function",
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
};

export const OPTION_VALUES_BASE = {
  field_name: "options_values",
  field_type: "text",
  is_textarea: true,
  length: 1000,
  is_editable: 1,
  is_required: 1,
  order: 2,
};
