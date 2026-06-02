import { useState } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import type {
  DynamicRecordActionsProps,
  ModalConfig,
} from "./DynamicRecordActions.types";
import { ApiError, CRUDResult } from "api/types";
import { useLabels } from "context/Label/Label";
import { useFeedback } from "hooks/useFeedback";
import { useApiMutation } from "hooks/useApiMutation";
import ModalScreen from "components/ModalScreen/ModalScreen";

/**
 * Shows an Action bar with buttons (based on the configuration)
 */
export default function DynamicRecordActions({
  editLabel,
  isEdit,
  setIsEdit,
  reset,
  errorPrefix,
  hasDeleteButton,
  pathAPI = undefined,
  payloadAPI = undefined,
  redirectAPI = undefined,
  extraActionOnDelete = undefined,
  extraDescription = undefined,
}: DynamicRecordActionsProps): React.ReactElement {
  const { getLabel } = useLabels();
  const { showErrorToast } = useFeedback();
  const { mutate, loading } = useApiMutation<Record<string, any>, CRUDResult>(
    pathAPI ?? "", // if the pathAPI is empty the mutate is never called. So doesn't matter the creation of the hook with ""
    "post",
  );
  const navigate = useNavigate();

  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    show: false,
    title: "",
    body: "",
  });

  const deleteRecord = async () => {
    if (!pathAPI || !redirectAPI || !payloadAPI) return;

    try {
      await mutate(payloadAPI);
      navigate(redirectAPI);
      if (extraActionOnDelete) {
        extraActionOnDelete();
      }
    } catch (err) {
      showErrorToast(err as ApiError, errorPrefix);
    }
  };

  const editDeleteActions = () => {
    return (
      <>
        <span>
          <Button
            className="ms-3 fw-medium"
            size="sm"
            onClick={() => setIsEdit(true)}
          >
            {editLabel}
          </Button>
          <Button
            hidden={!hasDeleteButton}
            className="ms-3 fw-medium"
            size="sm"
            onClick={() => {
              setModalConfig({
                show: true,
                title: getLabel("MODAL.DELETE.TITLE"),
                body: getLabel("MODAL.DELETE.BODY"),
              });
            }}
          >
            {getLabel("BUTTONS.DELETE")}
          </Button>
        </span>
        <span>{extraDescription}</span>
      </>
    );
  };

  const saveCancelActions = () => {
    return (
      <span>
        <Button
          className="ms-3 fw-medium"
          size="sm"
          type="submit"
          form="recordDetailForm"
        >
          {getLabel("BUTTONS.SAVE")}
        </Button>
        <Button
          className="ms-3 fw-medium"
          size="sm"
          onClick={() => {
            setIsEdit(false);
            reset();
          }}
        >
          {getLabel("BUTTONS.CANCEL")}
        </Button>
      </span>
    );
  };

  return (
    <div className="d-flex flex-row-reverse justify-content-between align-items-center pb-2 pt-2">
      {!isEdit ? editDeleteActions() : saveCancelActions()}
      <ModalScreen
        showModal={modalConfig.show}
        setShowModal={(val) => setModalConfig({ ...modalConfig, show: val })}
        successFunction={deleteRecord}
        titleText={modalConfig.title}
        bodyText={modalConfig.body}
        loading={loading}
      />
    </div>
  );
}
