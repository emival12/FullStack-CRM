import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  API_BASE_URL,
  ERROR_MISSING_RECORD,
  ERROR_MISSING_TABLE,
  PATH_DELETE,
  PATH_SETUP,
} from "../../../config/K";
import { EDIT_LABEL, MISSING_RECORD_LABEL } from "../../../config/IT";
import LoadingScreen from "../../../components/LoadingScreen";
import MissingPage from "../../../components/MissingPage";
import RecordButtons from "../../TableRecordDetails/RecordButtons";
import RecordForm from "../../TableRecordDetails/RecordForm";
import ToastMsg from "../../../components/ToastMsg";
import { addOptionsToObject, FieldTypes } from "../FieldTypes";

export default function EditFieldRecord({
  selectedTableKey,
  selectedSectionKey,
  selectedRecord,
  setSelectedRecord,
}) {
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [validated, setValidated] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastTitle, setToastTitle] = useState();
  const [toastBody, setToastBody] = useState();

  const [controlledError, setControlledError] = useState(false);

  const {
    fieldTypeForm,
    mapObjectFields,
    mapObjectRt,
    fieldTypes,
    listFieldForms,
    getCorrectForm,
    getCorrectFieldOptions,
  } = FieldTypes();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    resetField,
  } = useForm();

  const fetchData = () => {
    if (!selectedTableKey || !selectedRecord || !listFieldForms) return; // Blocks execution if the selected table is not correct

    setLoading(true);
    setIsEdit(false);
    setValidated(false);
    axios
      .post(
        API_BASE_URL +
          PATH_SETUP +
          "/" +
          selectedTableKey +
          "/fields/" +
          selectedRecord,
        {
          listFields: listFieldForms,
        }
      )
      .then((res) => {
        console.log(res);
        console.log("Setup edit Field Received:", res.data);
        setFields(res.data);

        //use to handle the values and redraw it
        const formValues = Object.fromEntries(
          Object.entries(res.data.field_structure).map(([key, info]) => [
            key,
            info.value,
          ])
        );
        reset(formValues);

        const refObj = res.data.field_structure?.Reference_object;
        if (refObj) {
          res.data.field_structure.Reference_field.options =
            getCorrectFieldOptions(refObj.value, res.data.field_type);
          resetField("reference_field");
        }
      })
      .catch((err) => {
        console.error("Error:", err);
        const errMsg = err.response.data.detail;
        if (
          errMsg === ERROR_MISSING_TABLE.replace("X", selectedTableKey) ||
          errMsg === ERROR_MISSING_RECORD.replace("X", selectedRecord)
        ) {
          setControlledError(true);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [listFieldForms]);

  const onSubmit = (data) => {
    console.log("submit"); // TODO
  };

  if (controlledError) {
    return <MissingPage MissingText={MISSING_RECORD_LABEL} />;
  }

  if (loading) return <LoadingScreen />;

  return (
    <>
      <RecordButtons
        setLoading={setLoading}
        setSelectedRecord={setSelectedRecord}
        editLabel={EDIT_LABEL}
        isEdit={isEdit}
        onEditClick={setIsEdit}
        reset={reset}
        setShowToast={setShowToast}
        setToastTitle={setToastTitle}
        setToastBody={setToastBody}
        hasDeleteButton={true}
        pathAPI={
          API_BASE_URL + PATH_SETUP + "/" + selectedSectionKey + PATH_DELETE
        }
        payloadAPI={{
          table: selectedTableKey,
          fieldName: selectedRecord,
        }}
        redirectAPI={
          PATH_SETUP + "/" + selectedTableKey + "/" + selectedSectionKey
        }
        extraDescription={null}
      ></RecordButtons>
      <RecordForm
        fields={fields.field_structure}
        validated={validated}
        onSubmit={handleSubmit(onSubmit)}
        selectedTableKey={selectedTableKey}
        errors={errors}
        register={register}
        isNewForm={false}
        isEdit={isEdit}
      ></RecordForm>
      <ToastMsg
        showToast={showToast}
        setShowToast={setShowToast}
        color="danger"
        title={toastTitle}
        body={toastBody}
      ></ToastMsg>
    </>
  );
}
