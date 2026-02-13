import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";

import {
  API_BASE_URL,
  ERROR_MISSING_RECORD,
  ERROR_MISSING_TABLE,
  PATH_DELETE,
  PATH_SETUP,
} from "../../../../config/K";
import { useLabels } from "../../../../config/Label";
import LoadingScreen from "../../../../components/LoadingScreen";
import MissingPage from "../../../../components/MissingPage";
import ToastMsg from "../../../../components/ToastMsg";
import { FieldTypes } from "../../FieldTypes";
import DynamicRecordActions from "../../../../components/dynamicUI/DynamicRecordActions";
import DynamicForm from "../../../../components/dynamicUI/DynamicForm";

export default function SetupSectionFieldsEdit({
  tableKey,
  sectionKey,
  recordId,
}) {
  const { getLabel } = useLabels();

  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [validated, setValidated] = useState(false);
  const [isDeletable, setIsDeletable] = useState(true);

  const [controlledError, setControlledError] = useState(false);
  const [toastConfig, setToastConfig] = useState({
    show: false,
    title: "",
    body: "",
  });

  const { formsByType, loadingFieldType, updateDependentOptions } =
    FieldTypes();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    resetField,
  } = useForm();

  const fetchData = useCallback(() => {
    if (!tableKey || !sectionKey || !recordId || !formsByType) return; // Blocks execution if the selected table is not correct

    setLoading(true);
    setIsEdit(false);
    setValidated(false);

    const apiData = {
      listFields: formsByType,
    };
    axios
      .post(
        `${API_BASE_URL}${PATH_SETUP}/${tableKey}/fields/${recordId}`,
        apiData,
      )
      .then((res) => {
        console.log(res);
        console.log("SetupSectionFieldsEdit - Edit Field Received:", res.data);
        setFields(res.data);
        setIsDeletable(res.data.object_primary_key_name !== recordId); // prevent delete of PrimaryKey

        //Insert the values retrieved into the form and redraw it
        const formValues = Object.fromEntries(
          Object.entries(res.data.field_structure).map(([key, info]) => [
            key,
            info.value,
          ]),
        );
        reset(formValues);

        updateDependentOptions(
          res.data.field_type,
          res.data.field_structure?.Reference_object?.value,
          "Reference_field",
          res.data.field_structure,
        );
        resetField("reference_field");
      })
      .catch((err) => {
        console.error("SetupSectionFieldsEdit - Error:", err);
        const errorCode = err.response.data.detail.error_code;
        if (
          errorCode === ERROR_MISSING_TABLE ||
          errorCode === ERROR_MISSING_RECORD
        ) {
          setControlledError(true);
        }
      })
      .finally(() => setLoading(false));
  }, [
    tableKey,
    sectionKey,
    recordId,
    formsByType,
    reset,
    resetField,
    updateDependentOptions,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = (data) => {
    console.log("TODO submit"); // TODO when we work on the setup implementations
  };

  if (controlledError) {
    return (
      <MissingPage missingText={getLabel("MISSING.MISSING_RECORD_LABEL")} />
    );
  }

  if (loading || loadingFieldType) return <LoadingScreen />;

  return (
    <>
      <DynamicRecordActions
        setLoading={setLoading}
        editLabel={getLabel("BUTTONS.EDIT_LABEL")}
        isEdit={isEdit}
        setIsEdit={setIsEdit}
        reset={reset}
        setToastConfig={setToastConfig}
        hasDeleteButton={isDeletable}
        pathAPI={`${API_BASE_URL}${PATH_SETUP}/${sectionKey}${PATH_DELETE}`}
        payloadAPI={{
          table: tableKey,
          fieldName: recordId,
        }}
        redirectAPI={`${PATH_SETUP}/${tableKey}/${sectionKey}`}
        extraActionOnDelete={null}
        extraDescription={null}
      />
      <DynamicForm
        fields={fields.field_structure}
        validated={validated}
        onSubmit={handleSubmit(onSubmit)}
        tableKey={tableKey}
        errors={errors}
        register={register}
        isNewForm={false}
        isEdit={isEdit}
      />
      <ToastMsg
        showToast={toastConfig.show}
        setShowToast={(val) => setToastConfig({ ...toastConfig, show: val })}
        color="danger"
        title={toastConfig.title}
        body={toastConfig.body}
      />
    </>
  );
}
