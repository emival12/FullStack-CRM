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
} from "../../../../config/IT";
import { API_BASE_URL, PATH_SETUP } from "../../../../config/K";
import ToastMsg from "../../../../components/ToastMsg";
import { FieldTypes } from "../../FieldTypes";
import DynamicForm from "../../../../components/dynamicUI/DynamicForm";
import LoadingScreen from "../../../../components/LoadingScreen";

/**
 * Modal used to retrieve the info needed on the field creation
 *
 * @param {String} props.tableKey             - Table currently selected
 * @param {Boolean} props.showNewModal        - Flag to show or hide the modal
 * @param {Function} props.setShowNewModal    - Function to update the flag showNewModal
 * @param {Function} props.refreshData        - Function to run the refresh on the record list
 */
export default function NewFieldRecord({
  tableKey,
  showNewModal,
  setShowNewModal,
  refreshData,
}) {
  const [pageNumber, setPageNumber] = useState(1);
  const [validated, setValidated] = useState(false);

  const [toastConfig, setToastConfig] = useState({
    show: false,
    title: "",
    body: "",
  });

  const {
    selectionForm,
    loadingFieldType,
    getSpecificFormByType,
    updateDependentOptions,
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
    const apiData = {
      table: tableKey,
      record: data,
    };
    axios
      .post(`${API_BASE_URL}${PATH_SETUP}/${tableKey}/field/new`, apiData)
      .then((res) => {
        console.log("NewFieldRecord - Create new field results:", res.data);
        if (res.data.result === 0) {
          setToastConfig({
            show: true,
            title: ERROR_TOAST_TITLE_LABEL,
            body: ERROR_TOAST_BODY_LABEL,
          });
        } else {
          setShowNewModal(false);
          setValidated(false);
          refreshData();
        }
      })
      .catch((err) => {
        console.error("NewFieldRecord - Error:", err);
        setToastConfig({
          show: true,
          title: ERROR_TOAST_TITLE_LABEL,
          body: err.response.data.detail,
        });
      });

    setValidated(true);
  };

  const selectedFieldType = watch("field_type");
  useEffect(() => {
    if (!selectedFieldType) return;

    const formStructure = getSpecificFormByType(selectedFieldType);
    const formValues = Object.fromEntries(
      Object.entries(formStructure).map(([key, info]) => [key, info.value]),
    );

    const mergedValues = {
      field_type: selectedFieldType,
      ...formValues,
    };
    reset(mergedValues);
  }, [selectedFieldType, getSpecificFormByType, reset]);

  const selectedReferenceObject = watch("reference_object");
  useEffect(() => {
    if (!selectedReferenceObject) return;

    updateDependentOptions(
      selectedFieldType,
      selectedReferenceObject,
      "reference_field",
    );
    resetField("reference_field");

    updateDependentOptions(
      selectedFieldType,
      selectedReferenceObject,
      "reference_object_record_type",
    );
    resetField("reference_object_record_type");
  }, [
    selectedFieldType,
    selectedReferenceObject,
    updateDependentOptions,
    resetField,
  ]);

  if (loadingFieldType) return <LoadingScreen />;

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
          <DynamicForm
            fields={
              pageNumber === 1
                ? selectionForm
                : getSpecificFormByType(selectedFieldType)
            }
            validated={validated}
            onSubmit={handleSubmit(onSubmit)}
            tableKey={tableKey}
            errors={errors}
            register={register}
            isNewForm={false}
            isEdit={true}
          />
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
            type="submit"
            form="recordDetailForm"
          >
            {SAVE_LABEL}
          </Button>
          <Button
            hidden={pageNumber !== 1}
            disabled={!selectedFieldType}
            variant="primary"
            onClick={() => setPageNumber(2)}
          >
            {NEXT_LABEL}
          </Button>
        </Modal.Footer>
      </Modal>
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
