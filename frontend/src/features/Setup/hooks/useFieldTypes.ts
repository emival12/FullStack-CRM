import { useCallback, useEffect, useMemo } from "react";

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
  ComputeDependentFormFunc,
  GenerateLookupOptionsFunc,
  GenerateOptionsFunc,
  GenerateRadioOptionsFunc,
  GetMetadataWithDependentOptionsFunc,
  GetSpecificFormByTypeFunc,
  NewSetupFieldStructure,
  NormalizeInputOptionsFunc,
  SortDictFunc,
} from "./useFieldTypes.types";
import { useFeedback } from "hooks/useFeedback";
import { useApiQuery } from "hooks/useApiQuery";
import { ENDPOINTS } from "api/endpoints";
import { FieldOptionLookup, FieldOptionRadio } from "commot.types";

// Receive an array with some values and convert them into an array of object with the format of Form options
const generateOptions: GenerateOptionsFunc = (
  optionsList,
  key_label,
  value_label,
) => {
  if (!optionsList) return [];

  return Object.entries(optionsList).map(([key, value]) => {
    return { [key_label]: key, [value_label]: value } as any;
  });
};

const isStringArray = (arr: any[]): arr is string[] => {
  return arr.length > 0 && typeof arr[0] === "string";
};

const normalizeInputOptions: NormalizeInputOptionsFunc = (options) => {
  if (!options) return {};

  if (isStringArray(options)) {
    return Object.fromEntries(options.map((value) => [value, value]));
  } else {
    return Object.fromEntries(options.map((item) => [item.key, item.label]));
  }
};

const generateRadioOptions: GenerateRadioOptionsFunc = (options) => {
  const data = normalizeInputOptions(options);
  return generateOptions<FieldOptionRadio>(data, "option_key", "option_label");
};

const generateLookupOptions: GenerateLookupOptionsFunc = (options) => {
  const data = normalizeInputOptions(options);
  return generateOptions<FieldOptionLookup>(data, "id", "reference_field");
};

// Receive a structure dict, a field name and some options. Clones the options inside the field name options of a clone of the structure dict
const cloneAndAddOptions: CloneAndAddOptionsFunc = (
  structureObject,
  fieldName,
  options,
) => {
  let clone = structuredClone(structureObject);
  clone[fieldName].options = options;
  return clone;
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

// Create and return the complete options list for lookupFields
const getCompletedMetadataFields = (
  databaseMetadata: NewSetupFieldStructure,
) => {
  const lookup_options = databaseMetadata.lookup_options;
  const commonLookupOptions = generateLookupOptions(lookup_options);
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

  return {
    COMPLETE_LOOKUP_FIELDS,
    COMPLETE_PICKLIST_FIELDS,
    COMPLETE_ROLLUP_FIELDS,
  };
};

const computeDependentForm: ComputeDependentFormFunc = (
  databaseMetadata,
  target,
  fieldName,
  fieldType,
  referenceObject,
) => {
  const sourceOptions =
    fieldName === "reference_object_record_type"
      ? databaseMetadata.rt_options
      : fieldType === databaseMetadata.field_types.ROLLUP
        ? databaseMetadata.fields_options_rollup
        : databaseMetadata.fields_options;

  const options = generateLookupOptions(sourceOptions?.[referenceObject]);
  if (target?.[fieldName]) {
    let clonedTarget = structuredClone(target);
    clonedTarget[fieldName].options = options;
    return clonedTarget;
  }

  return target;
};

export const useFieldTypes = () => {
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
    if (!databaseMetadata) return;

    const field_types = databaseMetadata.field_types;

    //Calculate the fieldType form options
    const field_types_without_auto_number = { ...field_types };
    delete field_types_without_auto_number.AUTO_NUMBER;
    const selectionForm = cloneAndAddOptions(
      NEW_FIELDS,
      "field_type",
      generateRadioOptions(Object.values(field_types_without_auto_number)),
    );

    //Complete the configuration with the options retrieved from the DB
    const {
      COMPLETE_LOOKUP_FIELDS,
      COMPLETE_PICKLIST_FIELDS,
      COMPLETE_ROLLUP_FIELDS,
    } = getCompletedMetadataFields(databaseMetadata);

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

    return { selectionForm: selectionForm, formsByType: formsByType };
  }, [databaseMetadata]);

  const getSpecificFormByType: GetSpecificFormByTypeFunc = useCallback(
    (fieldType) => {
      return formsData?.formsByType?.[fieldType];
    },
    [formsData],
  );

  const getMetadataWithDependentOptions: GetMetadataWithDependentOptionsFunc =
    useCallback(
      (fieldType, referenceObject, fieldName, target = undefined) => {
        if (!databaseMetadata) return;
        const realTarget = target || getSpecificFormByType(fieldType);
        if (!realTarget) return;

        return computeDependentForm(
          databaseMetadata,
          realTarget,
          fieldName,
          fieldType,
          referenceObject,
        );
      },
      [databaseMetadata, getSpecificFormByType],
    );

  return {
    formsByType: formsData?.formsByType,
    selectionForm: formsData?.selectionForm,
    loading,
    getSpecificFormByType,
    getMetadataWithDependentOptions,
  };
};
