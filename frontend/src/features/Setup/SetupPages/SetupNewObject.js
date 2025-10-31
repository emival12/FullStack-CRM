import axios from "axios";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { useForm } from "react-hook-form";

import {
  NEW_LABEL,
  SAVE_LABEL,
  ERROR_TOAST_BODY_LABEL,
  ERROR_TOAST_TITLE_LABEL,
  CANCEL_LABEL,
} from "../../../config/IT";
import { API_BASE_URL } from "../../../config/K";
import { fields_structure_new_object } from "../K_Setup";
import RecordForm from "../../TableRecordDetails/RecordForm";
import LoadingScreen from "../../../components/LoadingScreen";
import ToastMsg from "../../../components/ToastMsg";

export default function SetupNewObject() {
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
      {!showNewForm ? (
        <div className="d-flex flex-row-reverse justify-content-between pb-2 pt-2">
          <Button
            size="sm"
            onClick={() => {
              setShowNewForm(true);
            }}
          >
            {NEW_LABEL}
          </Button>

          <span>Seleziona una tabella da modificare</span>
        </div>
      ) : (
        <>
          <div className="d-flex flex-row-reverse pb-2 pt-2">
            <Button
              className="ms-3 fw-medium"
              size="sm"
              onClick={() => {
                setShowNewForm(false);
                reset();
              }}
            >
              {CANCEL_LABEL}
            </Button>
            <Button
              className="ms-3 fw-medium"
              size="sm"
              onClick={() => {
                document.getElementById("recordDetailForm").requestSubmit();
              }}
            >
              {SAVE_LABEL}
            </Button>
          </div>
          <RecordForm
            fields={fields_structure_new_object}
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
      )}
    </>
  );
}
