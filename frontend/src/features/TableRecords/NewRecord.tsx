import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Modal } from "react-bootstrap";

import type { NewRecordProps } from "./TableRecords.types";
import { MetadataFieldStructure } from "types/field.types";
import { ApiError, CRUDResult } from "api/types";
import { ENDPOINTS } from "api/endpoints";
import { useLabels } from "context/Label/Label";
import { useFeedback } from "hooks/useFeedback";
import { useApiQuery } from "hooks/useApiQuery";
import { useAuth } from "context/Auth/Auth";
import DynamicForm from "components/dynamicUI/DynamicForm/DynamicForm";
import LoadingScreen from "components/LoadingScreen/LoadingScreen";
import { useApiMutation } from "hooks/useApiMutation";

const PREFIX = "NEW_RECORD";

/**
 * Shows a modal with all the field of the object in order to create a new record
 */
export default function NewRecord({
  tableKey,
  showNewModal,
  setShowNewModal,
  refreshData,
}: NewRecordProps): React.ReactElement {
  const { getLabel } = useLabels();
  const { user } = useAuth();
  const { showErrorToast } = useFeedback();
  const {
    data: fields,
    loading: loadingForm,
    error: errorForm,
  } = useApiQuery<MetadataFieldStructure>(
    ENDPOINTS.records.newRecord(tableKey),
    {
      enabled: showNewModal,
    },
  );
  const { mutate, loading: loadingSubmit } = useApiMutation<
    Record<string, any>,
    CRUDResult
  >(ENDPOINTS.crud.insert, "post");
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const loading = loadingForm || loadingSubmit;

  useEffect(() => {
    if (errorForm) showErrorToast(errorForm, PREFIX);
  }, [errorForm, showErrorToast]);

  //Method fired when the button Save is pressed
  const onSubmit = async (data: Record<string, any>) => {
    const payload = {
      table: tableKey,
      record: data,
      user: user,
    };

    try {
      await mutate(payload);
      setShowNewModal(false);
      refreshData();
      reset();
    } catch (err) {
      showErrorToast(err as ApiError, PREFIX);
    }
  };

  const renderBody = () => {
    if (loading) return <LoadingScreen />;
    if (!fields) return getLabel("MODAL.INSERT.LOAD_ERROR");
    return (
      <DynamicForm
        fields={fields}
        validated={false}
        onSubmit={handleSubmit(onSubmit)}
        tableKey={tableKey}
        errors={errors}
        register={register}
        isNewForm={true}
      />
    );
  };

  return (
    <>
      <Modal
        show={showNewModal}
        onHide={() => {
          if (!loadingSubmit) {
            setShowNewModal(false);
            reset();
          }
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{getLabel("MODAL.INSERT.RECORD_TITLE")}</Modal.Title>
        </Modal.Header>

        <Modal.Body>{renderBody()}</Modal.Body>

        <Modal.Footer>
          <Button
            disabled={!fields}
            variant="primary"
            type="submit"
            form="recordDetailForm"
          >
            {getLabel("BUTTONS.SAVE")}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
