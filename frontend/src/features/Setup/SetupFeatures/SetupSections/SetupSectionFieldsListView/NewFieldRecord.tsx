import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Modal } from "react-bootstrap";

import { NewFieldRecordProps } from "./SetupSectionFieldsListView.types";
import { MetadataFieldStructure } from "types/field.types";
import { ApiError, CRUDResult } from "api/types";
import { ENDPOINTS } from "api/endpoints";
import { useLabels } from "context/Label/Label";
import { useFeedback } from "hooks/useFeedback";
import { useApiMutation } from "hooks/useApiMutation";
import { useFieldTypes } from "features/Setup/hooks/useFieldTypes";
import LoadingScreen from "components/LoadingScreen/LoadingScreen";
import DynamicForm from "components/dynamicUI/DynamicForm/DynamicForm";

/**
 * Modal used to retrieve the info needed on the field creation
 */
export default function NewFieldRecord({
  tableKey,
  showNewModal,
  setShowNewModal,
  refreshData,
}: NewFieldRecordProps): React.ReactElement {
  const { getLabel } = useLabels();
  const { showErrorToast } = useFeedback();
  const { mutate, loading: loadingSubmit } = useApiMutation<
    Record<string, any>,
    CRUDResult
  >(ENDPOINTS.setup.fields.new(tableKey ?? ""), "post");
  const {
    selectionForm,
    loading: loadingFieldType,
    getSpecificFormByType,
    getMetadataWithDependentOptions,
  } = useFieldTypes();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    resetField,
  } = useForm();

  const [currentForm, setCurrentForm] = useState<MetadataFieldStructure>();
  const [pageNumber, setPageNumber] = useState(1);
  const loading = loadingSubmit || loadingFieldType;

  //Method fired when the button Save is pressed
  const onSubmit = async (data: Record<string, any>) => {
    const payload = {
      table: tableKey,
      record: data,
    };

    try {
      await mutate(payload);
      setShowNewModal(false);
      setPageNumber(1);
      refreshData();
      reset();
    } catch (err) {
      showErrorToast(err as ApiError, "SETUP_NEW_FIELD");
    }
  };

  const selectedFieldType = watch("field_type");
  useEffect(() => {
    if (!selectedFieldType) return;

    const formStructure = getSpecificFormByType(selectedFieldType);
    if (!formStructure) return;
    setCurrentForm(formStructure);

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

    let newStructure = getMetadataWithDependentOptions(
      selectedFieldType,
      selectedReferenceObject,
      "reference_field",
    );
    newStructure = getMetadataWithDependentOptions(
      selectedFieldType,
      selectedReferenceObject,
      "reference_object_record_type",
      newStructure,
    );
    if (newStructure) setCurrentForm(newStructure);

    resetField("reference_field");
    resetField("reference_object_record_type");
  }, [
    selectedFieldType,
    selectedReferenceObject,
    getMetadataWithDependentOptions,
    resetField,
  ]);

  const renderBody = () => {
    const fields = pageNumber === 1 ? selectionForm : currentForm;

    if (loading) return <LoadingScreen />;
    if (!fields) return getLabel("MODAL.INSERT.LOAD_ERROR");
    return (
      <DynamicForm
        fields={fields}
        onSubmit={handleSubmit(onSubmit)}
        tableKey={tableKey}
        errors={errors}
        register={register}
        editability="byField"
      />
    );
  };

  const renderFooter = (isDisabled: boolean) => {
    return (
      <>
        <Button
          disabled={isDisabled}
          hidden={pageNumber === 1}
          variant="primary"
          onClick={() => setPageNumber(1)}
        >
          {getLabel("BUTTONS.PREVIOUS")}
        </Button>
        <Button
          disabled={isDisabled}
          hidden={pageNumber === 1}
          variant="primary"
          type="submit"
          form="recordDetailForm"
        >
          {getLabel("BUTTONS.SAVE")}
        </Button>
        <Button
          disabled={isDisabled || !selectedFieldType}
          hidden={pageNumber !== 1}
          variant="primary"
          onClick={() => setPageNumber(2)}
        >
          {getLabel("BUTTONS.NEXT")}
        </Button>
      </>
    );
  };

  return (
    <Modal
      show={showNewModal}
      onHide={() => {
        if (!loading) {
          reset();
          setValue("field_type", null);
          setPageNumber(1);
          setShowNewModal(false);
        }
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title>{getLabel("MODAL.INSERT.FIELD_TITLE")}</Modal.Title>
      </Modal.Header>

      <Modal.Body>{renderBody()}</Modal.Body>

      <Modal.Footer>{renderFooter(loading)}</Modal.Footer>
    </Modal>
  );
}
