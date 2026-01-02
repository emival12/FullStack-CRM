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
import { API_BASE_URL, PATH_SETUP } from "../../../config/K";
import RecordForm from "../../TableRecordDetails/RecordForm";
import ToastMsg from "../../../components/ToastMsg";
import { FieldTypes, mergeDict, addOptionsToObject } from "../FieldTypes";

/**
 * Modal used to retrieve the info needed on the field creation
 *
 * @param {Object} props.selectedTableKey     - Table currently selected
 * @param {Object} props.showNewModal         - Flag to show or hide the modal
 * @param {Function} props.setShowNewModal    - Function to update the flag showNewModal
 * @param {Function} props.refreshData        - Function to run the refresh on the record list
 */
export default function NewFieldRecord({
  selectedTableKey,
  showNewModal,
  setShowNewModal,
  refreshData,
}) {
  const [pageNumber, setPageNumber] = useState(1);
  const [validated, setValidated] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastTitle, setToastTitle] = useState();
  const [toastBody, setToastBody] = useState();

  const {
    fieldTypeForm,
    mapObjectFields,
    mapObjectRt,
    fieldTypes,
    listFieldForms,
    getCorrectForm,
  } = FieldTypes();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    resetField,
  } = useForm();

  //Method fired when the button Save is pressed
  const onSubmit = (data) => {
    const formPointer = document.getElementById("recordDetailForm");
    if (formPointer.checkValidity()) {
      axios
        .post(
          API_BASE_URL + PATH_SETUP + "/" + selectedTableKey + "/field/new",
          {
            table: selectedTableKey,
            record: data,
          }
        )
        .then((res) => {
          console.log("Create new field results:", res.data);
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
    }

    setValidated(true);
  };

  //Set the correct form after the field_type change
  const field_type_value = watch("field_type");
  useEffect(() => {
    if (!field_type_value || !(field_type_value in listFieldForms)) return;

    const formStructure = listFieldForms[field_type_value];
    const formValues = Object.fromEntries(
      Object.entries(formStructure).map(([key, info]) => [key, info.value])
    );

    const mergedValues = { field_type: field_type_value, ...formValues };
    reset(mergedValues);
  }, [field_type_value]);

  //Set the picklist for the reference field after the reference_object change
  const reference_object_value = watch("reference_object");
  useEffect(() => {
    if (!reference_object_value || !(reference_object_value in mapObjectFields))
      return;

    let new_options = [];
    addOptionsToObject(new_options, mapObjectFields[reference_object_value]);
    getCorrectForm(field_type_value).reference_field.options = new_options;
    resetField("reference_field");

    if (field_type_value === fieldTypes.ROLLUP) {
      let new_rt_options = [];
      addOptionsToObject(new_rt_options, mapObjectRt[reference_object_value]);
      getCorrectForm(field_type_value).reference_object_record_type.options =
        new_rt_options;
      resetField("reference_object_record_type");
    }
  }, [reference_object_value]);

  return (
    <>
      <Modal
        show={showNewModal}
        onHide={() => {
          reset();
          setValue("field_type", null);
          setPageNumber(1);
          setShowNewModal(false);
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{NEW_FIELD_TITLE_LABEL}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <RecordForm
            fields={
              pageNumber === 1
                ? fieldTypeForm
                : getCorrectForm(field_type_value)
            }
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
            disabled={!field_type_value}
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
