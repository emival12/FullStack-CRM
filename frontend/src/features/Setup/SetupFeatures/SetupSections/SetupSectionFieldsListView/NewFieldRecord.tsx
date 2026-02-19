import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Modal } from "react-bootstrap";
import { ToastConfig } from "commot.types";
import { NewFieldRecordProps } from "./SetupSectionFieldsListView.types";

import { API_BASE_URL, PATH_SETUP } from "config/K";
import { useLabels } from "context/Label/Label";
import ToastMsg from "components/ToastMsg/ToastMsg";
import LoadingScreen from "components/LoadingScreen/LoadingScreen";
import DynamicForm from "components/dynamicUI/DynamicForm/DynamicForm";
import { DataFieldStructure } from "components/dynamicUI/DynamicForm/DynamicForm.types";
import { FieldTypes } from "features/Setup/FieldTypes/FieldTypes";

/**
 * Modal used to retrieve the info needed on the field creation
 */
export default function NewFieldRecord({
  tableKey,
  showNewModal,
  setShowNewModal,
  refreshData,
}: NewFieldRecordProps) {
  const { getLabel } = useLabels();

  const [pageNumber, setPageNumber] = useState(1);
  const [validated, setValidated] = useState(false);

  const [toastConfig, setToastConfig] = useState<ToastConfig>({
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
  const onSubmit = (data: Record<string, any>) => {
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
            title: getLabel("TOAST.ERROR_TOAST_TITLE_LABEL"),
            body: getLabel("TOAST.ERROR_TOAST_BODY_LABEL"),
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
          title: getLabel("TOAST.ERROR_TOAST_TITLE_LABEL"),
          body:
            err?.response?.data?.detail ||
            getLabel("TOAST.ERROR_TOAST_BODY_LABEL"),
        });
      });

    setValidated(true);
  };

  const selectedFieldType = watch("field_type");
  useEffect(() => {
    if (!selectedFieldType) return;

    const formStructure = getSpecificFormByType(selectedFieldType);
    if (!formStructure) return;
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
          <Modal.Title>
            {getLabel("MODAL.INSERT.NEW_FIELD_TITLE_LABEL")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DynamicForm
            fields={
              pageNumber === 1
                ? (selectionForm as DataFieldStructure)
                : (getSpecificFormByType(
                    selectedFieldType,
                  ) as DataFieldStructure)
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
            {getLabel("BUTTONS.PREVIOUS_LABEL")}
          </Button>
          <Button
            hidden={pageNumber === 1}
            variant="primary"
            type="submit"
            form="recordDetailForm"
          >
            {getLabel("BUTTONS.SAVE_LABEL")}
          </Button>
          <Button
            hidden={pageNumber !== 1}
            disabled={!selectedFieldType}
            variant="primary"
            onClick={() => setPageNumber(2)}
          >
            {getLabel("BUTTONS.NEXT_LABEL")}
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
