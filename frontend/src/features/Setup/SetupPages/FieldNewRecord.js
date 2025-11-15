import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Modal } from "react-bootstrap";

import {
  SAVE_LABEL,
  ERROR_TOAST_BODY_LABEL,
  ERROR_TOAST_TITLE_LABEL,
  NEW_FIELD_TITLE_LABEL,
  NEXT_LABEL,
  PREVIOUS_LABEL,
} from "../../../config/IT";
import { API_BASE_URL, PATH_INSERT } from "../../../config/K";
import {
  BASE_FIELD_OBJECT_STRUCTURE as BASE_FIELDS,
  NEW_TEXT_FIELD_OBJECT_STRUCTURE as NEW_TEXT_FIELDS,
} from "../K_Setup";
import RecordForm from "../../TableRecordDetails/RecordForm";
import ToastMsg from "../../../components/ToastMsg";

export default function FieldNewRecord({
  fieldTypeForm,
  selectedTableKey,
  showNewModal,
  setShowNewModal,
  refreshData,
}) {
  const [listFieldForms, setListFieldForms] = useState(false);
  const [validated, setValidated] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastTitle, setToastTitle] = useState();
  const [toastBody, setToastBody] = useState();

  const [pageNumber, setPageNumber] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
    reset,
  } = useForm();

  const mergeDict = (dict1, dict2) => {
    const merged = {
      ...dict1,
      ...dict2,
    };

    return Object.fromEntries(
      Object.entries(merged).sort(([, a], [, b]) => a.order - b.order)
    );
  };

  useEffect(() => {
    axios
      .get(API_BASE_URL + "/field_types")
      .then((res) => {
        console.log("Field Types Received:", res.data);

        setListFieldForms({
          [res.data.TEXT]: mergeDict(BASE_FIELDS, NEW_TEXT_FIELDS),
          [res.data.NUMBER]: mergeDict(BASE_FIELDS, NEW_TEXT_FIELDS),
          [res.data.LOOKUP]: mergeDict(BASE_FIELDS, NEW_TEXT_FIELDS),
          [res.data.PICKLIST]: mergeDict(BASE_FIELDS, NEW_TEXT_FIELDS),
          [res.data.ROLLUP]: mergeDict(BASE_FIELDS, NEW_TEXT_FIELDS),
          [res.data.RADIO]: mergeDict(BASE_FIELDS, NEW_TEXT_FIELDS),
          [res.data.CHECKBOX]: mergeDict(BASE_FIELDS, NEW_TEXT_FIELDS),
        });

        if (fieldTypeForm.Field_type.options.length == 0) {
          for (let ft of Object.values(res.data)) {
            fieldTypeForm.Field_type.options.push({
              option_label: ft,
              option_key: ft,
            });
          }
        }
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => {});
  }, []);

  //Method fired when the button Save is pressed
  const onSubmit = (data) => {
    const formPointer = document.getElementById("recordDetailForm");
    if (formPointer.checkValidity()) {
      /*
        axios
        .post(API_BASE_URL + PATH_INSERT, {
          table: selectedTableKey,
          record: data,
        })
        .then((res) => {
          console.log("Uploaded new record results:", res.data);
          if (res.data.result == 0) {
            setShowToast(true);
            setToastTitle(ERROR_TOAST_TITLE_LABEL);
            setToastBody(ERROR_TOAST_BODY_LABEL);
          } else {
            setShowNewModal(false);
            refreshData();
          }
        })
        .catch((err) => {
          console.error("Error:", err);

          setShowToast(true);
          setToastTitle(ERROR_TOAST_TITLE_LABEL);
          setToastBody(err.response.data.detail);
        });
        */
    }

    setValidated(true);
  };

  const field_type_value = watch("Field_type");
  useEffect(() => {
    if (!field_type_value) return;

    const formStructure = listFieldForms[field_type_value];
    const formValues = Object.fromEntries(
      Object.entries(formStructure).map(([key, info]) => [key, info.value])
    );

    const currentValues = getValues();
    const mergedValues = { ...currentValues, ...formValues };
    reset(mergedValues);
  }, [field_type_value]);

  const getCorrectForm = () => {
    return listFieldForms[field_type_value];
  };

  return (
    <>
      <Modal show={showNewModal} onHide={() => setShowNewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{NEW_FIELD_TITLE_LABEL}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <RecordForm
            fields={pageNumber === 1 ? fieldTypeForm : getCorrectForm()}
            validated={validated}
            onSubmit={handleSubmit(onSubmit)}
            selectedTableKey={selectedTableKey}
            errors={errors}
            register={register}
            isNewForm={false}
            isEdit={true}
          ></RecordForm>
        </Modal.Body>

        <Modal.Footer>
          <Button
            hidden={pageNumber === 1}
            variant="primary"
            onClick={() => setPageNumber(1)}
          >
            {PREVIOUS_LABEL}
          </Button>
          <Button
            hidden={pageNumber === 1}
            variant="primary"
            onClick={() =>
              document.getElementById("recordDetailForm").requestSubmit()
            }
          >
            {SAVE_LABEL}
          </Button>
          <Button
            hidden={pageNumber !== 1}
            disabled={!watch("Field_type")}
            variant="primary"
            onClick={() => setPageNumber(2)}
          >
            {NEXT_LABEL}
          </Button>
        </Modal.Footer>
      </Modal>
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
