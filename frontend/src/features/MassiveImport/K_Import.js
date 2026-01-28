export const Operations = {
  insert: "insert",
  update: "update",
};

//Structure form import
export const IMPORT_FIELD_STRUCTURE = {
  Operation_type: {
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
  },
  Object_name: {
    field_name: "object_name",
    field_type: "lookup",
    is_editable: 1,
    is_required: 1,
    options: [],
    order: 1,
  },
};
