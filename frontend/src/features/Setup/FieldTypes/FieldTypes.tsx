import { useEffect, useMemo, useCallback } from "react";

import {
  NEW_FIELD_OBJECT_STRUCTURE as NEW_FIELDS,
  NEW_TEXT_FIELD_OBJECT_STRUCTURE as NEW_TEXT_FIELDS,
  NEW_NUMBER_FIELD_OBJECT_STRUCTURE as NEW_NUMBER_FIELDS,
  NEW_LOOKUP_FIELD_OBJECT_STRUCTURE as NEW_LOOKUP_FIELDS,
  NEW_PICKLIST_FIELD_OBJECT_STRUCTURE as NEW_PICKLIST_FIELDS,
  NEW_ROLLUP_FIELD_OBJECT_STRUCTURE as NEW_ROLLUP_FIELDS,
  NEW_RADIO_FIELD_OBJECT_STRUCTURE as NEW_RADIO_FIELDS,
  NEW_CHECKBOX_FIELD_OBJECT_STRUCTURE as NEW_CHECKBOX_FIELDS,
  FULL_AUTO_NUMBER_FIELD_STRUCTURE,
  NEW_DATE_FIELD_OBJECT_STRUCTURE,
  NEW_IMG_FIELD_OBJECT_STRUCTURE,
  NEW_FORMULA_FIELD_STRUCTURE,
} from "features/Setup/K_SetupFormsStructure";
import {
  CloneAndAddOptionsFunc,
  GenerateOptionsFunc,
  GetSpecificFormByTypeFunc,
  MergeDictFunc,
  NewSetupFieldStructure,
  SortDictFunc,
  UpdateDependentOptionsFunc,
} from "./FieldTypes.types";
import { FieldOptionLookup, FieldOptionRadio } from "commot.types";
import { ENDPOINTS } from "api/endpoints";
import { useApiQuery } from "hooks/useApiQuery";
import { useFeedback } from "hooks/useFeedback";

export function FieldTypes() {
  const { showErrorToast } = useFeedback();
  const {
    data: databaseMetadata,
    loading,
    error,
  } = useApiQuery<NewSetupFieldStructure>(ENDPOINTS.setup.fields.newStructure);

  useEffect(() => {
    if (error) showErrorToast(error, "FIELD_TYPES");
  }, [error, showErrorToast]);

  const formsData = useMemo(() => {
    if (!databaseMetadata) return null;

    const { field_types, lookup_options } = databaseMetadata;

    //Complete the configuration with the options retrieved from the DB
    const commonLookupOptions = generateOptions(lookup_options) ?? [];
    const COMPLETE_LOOKUP_FIELDS = cloneAndAddOptions(
      NEW_LOOKUP_FIELDS,
      "reference_object",
      commonLookupOptions,
    );
    const COMPLETE_PICKLIST_FIELDS = cloneAndAddOptions(
      NEW_PICKLIST_FIELDS,
      "reference_object",
      commonLookupOptions,
    );
    const COMPLETE_ROLLUP_FIELDS = cloneAndAddOptions(
      NEW_ROLLUP_FIELDS,
      "reference_object",
      commonLookupOptions,
    );

    const field_types_without_auto_number = { ...field_types };
    delete field_types_without_auto_number.AUTO_NUMBER;
    const selectionForm = cloneAndAddOptions(
      NEW_FIELDS,
      "field_type",
      generateOptions(Object.values(field_types_without_auto_number), false) ??
        [],
    );

    const formsByType = {
      [field_types.TEXT]: sortDict(NEW_TEXT_FIELDS),
      [field_types.NUMBER]: sortDict(NEW_NUMBER_FIELDS),
      [field_types.LOOKUP]: sortDict(COMPLETE_LOOKUP_FIELDS),
      [field_types.PICKLIST]: sortDict(COMPLETE_PICKLIST_FIELDS),
      [field_types.ROLLUP]: sortDict(COMPLETE_ROLLUP_FIELDS),
      [field_types.RADIO]: sortDict(NEW_RADIO_FIELDS),
      [field_types.CHECKBOX]: sortDict(NEW_CHECKBOX_FIELDS),
      [field_types.DATE]: sortDict(NEW_DATE_FIELD_OBJECT_STRUCTURE),
      [field_types.DATE_TIME]: sortDict(NEW_DATE_FIELD_OBJECT_STRUCTURE),
      [field_types.IMG]: sortDict(NEW_IMG_FIELD_OBJECT_STRUCTURE),
      [field_types.AUTO_NUMBER]: sortDict(FULL_AUTO_NUMBER_FIELD_STRUCTURE),
      [field_types.FORMULA]: sortDict(NEW_FORMULA_FIELD_STRUCTURE),
    };

    return {
      selectionForm,
      formsByType,
    };
  }, [databaseMetadata]);

  const getSpecificFormByType: GetSpecificFormByTypeFunc = useCallback(
    (fieldType) => {
      return formsData?.formsByType?.[fieldType] || null;
    },
    [formsData],
  );

  const updateDependentOptions: UpdateDependentOptionsFunc = useCallback(
    (fieldType, referenceObject, fieldName, target = undefined) => {
      if (!databaseMetadata) return;

      const sourceMap =
        fieldName === "reference_object_record_type"
          ? databaseMetadata.rt_options
          : fieldType === databaseMetadata.field_types.ROLLUP
            ? databaseMetadata.fields_options_rollup
            : databaseMetadata.fields_options;

      const options = generateOptions(sourceMap?.[referenceObject]);
      if (!options) return;

      let targetForm = target || getSpecificFormByType(fieldType);
      if (targetForm?.[fieldName]) targetForm[fieldName].options = options;
    },
    [databaseMetadata, getSpecificFormByType],
  );

  return {
    selectionForm: formsData?.selectionForm,
    formsByType: formsData?.formsByType,
    loadingFieldType: loading,
    getSpecificFormByType,
    updateDependentOptions,
  };
}

// Receive a structure dict, a field name and some options
// Clones the options inside the field name options of a clone of the structure dict
export const cloneAndAddOptions: CloneAndAddOptionsFunc = (
  structureObject,
  fieldName,
  options,
) => {
  let clone = structuredClone(structureObject);
  clone[fieldName].options = options;
  return clone;
};

// Receive an array with some values and convert them into an array of object with the format of Form options
export const generateOptions: GenerateOptionsFunc = (
  options,
  usePicklistOptionFormat = true,
) => {
  if (!options) return;

  const optionsArray = Array.isArray(options)
    ? options
    : Object.values(options);

  return optionsArray.map((item: any) => {
    const value = item?.key ?? item;
    const label = item?.label ?? item;

    if (usePicklistOptionFormat) {
      // Picklist format
      return { id: value, reference_field: label } as FieldOptionLookup;
    } else {
      // Radio format
      return { option_key: value, option_label: label } as FieldOptionRadio;
    }
  });
};

export const mergeDict: MergeDictFunc = (dict1, dict2) => {
  const merged = {
    ...dict1,
    ...dict2,
  };

  return sortDict(merged);
};

const sortDict: SortDictFunc = (dict) => {
  return Object.fromEntries(
    Object.entries(dict).sort(([, a], [, b]) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      return orderA - orderB;
    }),
  );
};
