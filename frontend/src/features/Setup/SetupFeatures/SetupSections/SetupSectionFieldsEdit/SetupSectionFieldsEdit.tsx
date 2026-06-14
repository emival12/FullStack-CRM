import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { SetupFieldStructure } from "./SetupSectionFieldsEdit.types";
import { SetupSectionCompleteProps } from "features/Setup/SetupFeatures/SetupSections/SetupSections.types";
import { FieldType } from "types/field.types";
import { ApiError } from "api/types";
import { ERROR_MISSING_RECORD, PATH_SETUP } from "config/K";
import { ENDPOINTS } from "api/endpoints";
import { useLabels } from "context/Label/Label";
import { useFeedback } from "hooks/useFeedback";
import { useApiMutation } from "hooks/useApiMutation";
import { useFieldTypes } from "features/Setup/hooks/useFieldTypes";
import LoadingScreen from "components/LoadingScreen/LoadingScreen";
import MissingPage from "components/MissingPage/MissingPage";
import DynamicRecordActions from "components/dynamicUI/DynamicRecordActions/DynamicRecordActions";
import DynamicForm from "components/dynamicUI/DynamicForm/DynamicForm";

const PREFIX = "SETUP_FIELD_EDIT";

export default function SetupSectionFieldsEdit({
  tableKey,
  sectionKey,
  recordId,
}: SetupSectionCompleteProps): React.ReactElement | null {
  const { getLabel } = useLabels();
  const { showErrorToast } = useFeedback();
  const {
    mutate: mutateForm,
    loading: loadingForm,
    error: errorForm,
  } = useApiMutation<Record<string, any>, SetupFieldStructure>(
    ENDPOINTS.setup.fields.record(tableKey ?? "", recordId ?? ""),
    "post",
  );
  const {
    formsByType,
    loading: loadingFieldType,
    getMetadataWithDependentOptions,
  } = useFieldTypes();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    resetField,
  } = useForm();

  const [fields, setFields] = useState<SetupFieldStructure>();
  const [isEdit, setIsEdit] = useState(false);
  const [isDeletable, setIsDeletable] = useState(true);
  const isMissingRecord = errorForm?.errorCode === ERROR_MISSING_RECORD;
  const loading = loadingForm || loadingFieldType;

  useEffect(() => {
    if (!tableKey || !sectionKey || !recordId || !formsByType) return; // Blocks execution if the selected table is not correct

    setIsEdit(false);
    let cancelled = false;
    const payload = {
      listFields: formsByType,
    };

    mutateForm(payload)
      .then((res) => {
        if (!cancelled) {
          setIsDeletable(res.object_primary_key_name !== recordId); // prevent delete of PrimaryKey

          //Insert the values retrieved into the form and redraw it
          const formValues = Object.fromEntries(
            Object.entries(res.field_structure).map(([key, info]) => [
              key,
              info.value,
            ]),
          );
          reset(formValues);

          const newStructure =
            getMetadataWithDependentOptions(
              res.field_type as FieldType,
              res.field_structure?.Reference_object?.value,
              "Reference_field",
              res.field_structure,
            ) || res.field_structure;

          setFields({ ...res, field_structure: newStructure });
          resetField("reference_field");
        }
      })
      .catch((err) => {
        if (!cancelled && err.errorCode !== ERROR_MISSING_RECORD)
          showErrorToast(err as ApiError, PREFIX);
      });
    return () => {
      cancelled = true;
    };
  }, [
    tableKey,
    sectionKey,
    recordId,
    formsByType,
    reset,
    resetField,
    getMetadataWithDependentOptions,
    mutateForm,
    showErrorToast,
  ]);

  const onSubmit = (data: Record<string, any>) => {
    console.log("TODO submit", data); // TODO when we work on the setup implementations
  };

  if (isMissingRecord) {
    return <MissingPage missingText={getLabel("MISSING.RECORD")} />;
  }

  if (loading) return <LoadingScreen />;

  if (!fields) return null;

  return (
    <>
      <DynamicRecordActions
        editLabel={getLabel("BUTTONS.EDIT")}
        isEdit={isEdit}
        setIsEdit={setIsEdit}
        reset={reset}
        errorPrefix={PREFIX}
        hasDeleteButton={isDeletable}
        pathAPI={ENDPOINTS.setup.fields.delete}
        payloadAPI={{
          table: tableKey,
          fieldName: recordId,
        }}
        redirectAPI={`${PATH_SETUP}/${tableKey}/${sectionKey}`}
      />
      <DynamicForm
        fields={fields?.field_structure}
        onSubmit={handleSubmit(onSubmit)}
        tableKey={tableKey}
        errors={errors}
        register={register}
        editability={isEdit ? "byField" : "none"}
      />
    </>
  );
}
