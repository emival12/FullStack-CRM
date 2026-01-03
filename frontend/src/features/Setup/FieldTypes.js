import axios from "axios";
import { useEffect, useState } from "react";

import {
  NEW_FIELD_OBJECT_STRUCTURE as NEW_FIELDS,
  BASE_FIELD_OBJECT_STRUCTURE as BASE_FIELDS,
  NEW_TEXT_FIELD_OBJECT_STRUCTURE as NEW_TEXT_FIELDS,
  NEW_NUMBER_FIELD_OBJECT_STRUCTURE as NEW_NUMBER_FIELDS,
  NEW_LOOKUP_FIELD_OBJECT_STRUCTURE as NEW_LOOKUP_FIELDS,
  NEW_PICKLIST_FIELD_OBJECT_STRUCTURE as NEW_PICKLIST_FIELDS,
  NEW_ROLLUP_FIELD_OBJECT_STRUCTURE as NEW_ROLLUP_FIELDS,
  NEW_RADIO_FIELD_OBJECT_STRUCTURE as NEW_RADIO_FIELDS,
  NEW_CHECKBOX_FIELD_OBJECT_STRUCTURE as NEW_CHECKBOX_FIELDS,
} from "./K_Setup";
import { API_BASE_URL, PATH_SETUP } from "../../config/K";

export function FieldTypes() {
  const [fieldTypeForm, setFieldTypeForm] = useState(NEW_FIELDS);
  const [listFieldForms, setListFieldForms] = useState(false);

  const [mapObjectFields, setMapObjectFields] = useState();
  const [mapObjectFieldsRollup, setMapObjectFieldsRollup] = useState();
  const [mapObjectRt, setMapObjectRt] = useState();
  const [fieldTypes, setFieldTypes] = useState();

  useEffect(() => {
    axios
      .get(API_BASE_URL + PATH_SETUP + "/field/new/structure")
      .then((res) => {
        console.log("Setup new Field structure Received:", res.data);
        setMapObjectFields(res.data.fields_options);
        setMapObjectFieldsRollup(res.data.fields_options_rollup);
        setMapObjectRt(res.data.rt_options);
        setFieldTypes(res.data.field_types);

        const field_types = res.data.field_types;

        //Set the possible lookup object possibilities
        let obj_lookup_options = res.data.lookup_options;
        addOptionsToObject(
          NEW_LOOKUP_FIELDS.reference_object.options,
          obj_lookup_options
        );
        addOptionsToObject(
          NEW_PICKLIST_FIELDS.reference_object.options,
          obj_lookup_options
        );
        addOptionsToObject(
          NEW_ROLLUP_FIELDS.reference_object.options,
          obj_lookup_options
        );

        setListFieldForms({
          [field_types.TEXT]: mergeDict(BASE_FIELDS, NEW_TEXT_FIELDS),
          [field_types.NUMBER]: mergeDict(BASE_FIELDS, NEW_NUMBER_FIELDS),
          [field_types.LOOKUP]: mergeDict(BASE_FIELDS, NEW_LOOKUP_FIELDS),
          [field_types.PICKLIST]: mergeDict(BASE_FIELDS, NEW_PICKLIST_FIELDS),
          [field_types.ROLLUP]: mergeDict(BASE_FIELDS, NEW_ROLLUP_FIELDS),
          [field_types.RADIO]: mergeDict(BASE_FIELDS, NEW_RADIO_FIELDS),
          [field_types.CHECKBOX]: mergeDict(BASE_FIELDS, NEW_CHECKBOX_FIELDS),
        });

        //Set the possible field type possibilities
        addOptionsToObject(
          fieldTypeForm.field_type.options,
          field_types,
          false
        );
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => {});
  }, []);

  const getCorrectForm = (field_type_value) => {
    return listFieldForms[field_type_value];
  };

  const getCorrectFieldOptions = (reference_object_value, field_type_value) => {
    let correctMap =
      field_type_value === fieldTypes.ROLLUP
        ? mapObjectFieldsRollup
        : mapObjectFields;

    let new_options = [];
    addOptionsToObject(new_options, correctMap[reference_object_value]);
    return new_options;
  };

  return {
    fieldTypeForm,
    mapObjectFields,
    mapObjectRt,
    fieldTypes,
    listFieldForms,
    getCorrectForm,
    getCorrectFieldOptions,
  };
}

export const mergeDict = (dict1, dict2) => {
  const merged = {
    ...dict1,
    ...dict2,
  };

  return Object.fromEntries(
    Object.entries(merged).sort(([, a], [, b]) => a.order - b.order)
  );
};

export const addOptionsToObject = (object, options, is_selection = true) => {
  const key = is_selection ? "id" : "option_label";
  const value = is_selection ? "reference_field" : "option_key";

  if (object.length == 0) {
    for (let o of Object.values(options)) {
      const key_value = o?.key ? o?.key : o;
      const label_value = o?.label ? o?.label : o;

      object.push({
        [key]: key_value,
        [value]: label_value,
      });
    }
  }
};
