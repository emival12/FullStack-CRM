import axios from "axios";
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useForm } from "react-hook-form";

import {
  NEW_LABEL,
  ERROR_TOAST_BODY_LABEL,
  ERROR_TOAST_TITLE_LABEL,
  SETUP_MSG_SELECT_TABLE_LABEL,
} from "../../../config/IT";
import { API_BASE_URL, PATH_SETUP } from "../../../config/K";
import { NEW_OBJECT_FIELD_STRUCTURE } from "../K_Setup";
import RecordForm from "../../TableRecordDetails/RecordForm";
import LoadingScreen from "../../../components/LoadingScreen";
import ToastMsg from "../../../components/ToastMsg";
import RecordButtons from "../../TableRecordDetails/RecordButtons";

export default function SetupNewObject() {
  const {
    selectedTableKey,
    selectedSectionKey,
    setSelectedTableKey,
    setSelectedSection,
    refreshSidebar,
    setRefreshSidebar,
  } = useOutletContext();

  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastTitle, setToastTitle] = useState();
  const [toastBody, setToastBody] = useState();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  //Method fired when the button Save is pressed
  const onSubmit = (data) => {
    const formPointer = document.getElementById("recordDetailForm");
    if (formPointer.checkValidity()) {
      setLoading(true);
      axios
        .post(API_BASE_URL + "/new-object", {
          data: data,
        })
        .then((res) => {
          console.log("Insert object results:", res.data);
          if (res.data.result == 0) {
            setShowToast(true);
            setToastTitle(ERROR_TOAST_TITLE_LABEL);
            setToastBody(ERROR_TOAST_BODY_LABEL);
          } else {
            setShowNewForm(false);
            setValidated(false);
            setRefreshSidebar(!refreshSidebar);
            reset();
          }
        })
        .catch((err) => {
          console.error("Error:", err);

          setShowToast(true);
          setToastTitle(ERROR_TOAST_TITLE_LABEL);
          setToastBody(err.response.data.detail);
        })
        .finally(() => setLoading(false));
    }

    setValidated(true);
  };

  if (loading) return <LoadingScreen />;

  return (
    <>
      <RecordButtons
        setLoading={setLoading}
        setSelectedRecord={() => {}}
        editLabel={NEW_LABEL}
        isEdit={showNewForm}
        onEditClick={setShowNewForm}
        reset={reset}
        setShowToast={setShowToast}
        setToastTitle={setToastTitle}
        setToastBody={setToastBody}
        hasDeleteButton={false}
        pathAPI={null}
        payloadAPI={null}
        redirectAPI={null}
        extraDescription={SETUP_MSG_SELECT_TABLE_LABEL}
      ></RecordButtons>
      {showNewForm ? (
        <>
          <RecordForm
            fields={NEW_OBJECT_FIELD_STRUCTURE}
            validated={validated}
            onSubmit={handleSubmit(onSubmit)}
            selectedTableKey={null}
            errors={errors}
            register={register}
            isNewForm={true}
            isEdit={null}
          ></RecordForm>
          <ToastMsg
            showToast={showToast}
            setShowToast={setShowToast}
            color="danger"
            title={toastTitle}
            body={toastBody}
          ></ToastMsg>
        </>
      ) : (
        ""
      )}
    </>
  );
}
