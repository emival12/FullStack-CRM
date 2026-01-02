import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useOutletContext, useParams } from "react-router-dom";

import {
  EDIT_LABEL,
  ERROR_TOAST_BODY_LABEL,
  ERROR_TOAST_TITLE_LABEL,
} from "../../../config/IT";
import { HOME_OBJECT_FIELD_STRUCTURE } from "../K_Setup";
import RecordForm from "../../TableRecordDetails/RecordForm";
import ToastMsg from "../../../components/ToastMsg";
import RecordButtons from "../../TableRecordDetails/RecordButtons";
import LoadingScreen from "../../../components/LoadingScreen";
import {
  API_BASE_URL,
  PATH_DELETE,
  PATH_SETUP,
  PATH_UPDATE,
} from "../../../config/K";

/**
 * Page used for the section Home of an object in the setup
 *
 * @param {Object} props.selectedTableKey       - Table currently selected
 * @param {Function} props.setSelectedTableKey  - Function to update the selected Table
 * @param {Object} props.selectedSectionKey     - Section currently selected
 */
export default function SetupSectionHome({
  selectedTableKey,
  setSelectedTableKey,
  selectedSectionKey,
}) {
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [validated, setValidated] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastTitle, setToastTitle] = useState();
  const [toastBody, setToastBody] = useState();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const fetchData = () => {
    if (!selectedTableKey || !selectedSectionKey) return; // Blocks execution if the selected tabel is not correct

    setLoading(true);
    setIsEdit(false);
    setValidated(false);
    axios
      .get(API_BASE_URL + PATH_SETUP + "/" + selectedTableKey)
      .then((res) => {
        console.log("Setup Object Field List Received:", res.data);
        setFields(res.data);

        //use to handle the values and redraw it
        const formValues = Object.fromEntries(
          Object.entries(HOME_OBJECT_FIELD_STRUCTURE).map(([key, info]) => [
            key,
            res.data[key.toLowerCase()],
          ])
        );
        reset(formValues);
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  //Method fired when the button Save is pressed
  const onSubmit = (data) => {
    let modified_data = {};
    for (const key in data) {
      if (fields[key.toLowerCase()] != data[key]) {
        modified_data[key] = data[key];
      }
    }

    if (Object.keys(modified_data).length > 0) {
      const formPointer = document.getElementById("recordDetailForm");
      if (formPointer.checkValidity()) {
        setLoading(true);
        axios
          .post(
            API_BASE_URL + PATH_SETUP + "/" + selectedSectionKey + PATH_UPDATE,
            {
              table: selectedTableKey,
              field: modified_data,
            }
          )
          .then((res) => {
            console.log("Updated sections results:", res.data);
            if (res.data.result == 0) {
              setShowToast(true);
              setToastTitle(ERROR_TOAST_TITLE_LABEL);
              setToastBody(ERROR_TOAST_BODY_LABEL);
            } else {
              fetchData();
              setIsEdit(false);
            }
          })
          .catch((err) => {
            console.error("Error:", err);

            setShowToast(true);
            setToastTitle(ERROR_TOAST_TITLE_LABEL);
            setToastBody(err.response.data.detail);
          })
          .finally(() => setLoading(false));
      } else {
        reset();
        setIsEdit(false);
      }

      setValidated(true);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <>
      <RecordButtons
        setLoading={setLoading}
        setSelectedRecord={setSelectedTableKey}
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
        }}
        redirectAPI={PATH_SETUP}
        extraDescription={null}
      ></RecordButtons>
      <RecordForm
        fields={HOME_OBJECT_FIELD_STRUCTURE}
        validated={validated}
        onSubmit={handleSubmit(onSubmit)}
        selectedTableKey={null}
        errors={errors}
        register={register}
        isNewForm={null}
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
