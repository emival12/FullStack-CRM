import axios from "axios";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import type { DynamicRecordActionsProps } from "./DynamicRecordActions.types";

import { useLabels } from "context/Label/Label";
import ModalScreen from "components/ModalScreen/ModalScreen";
import type { ModalConfig } from "commot.types";

/**
 * Shows an Action bar with buttons (based on the configuration)
 */
export default function DynamicRecordActions({
  setLoading,
  editLabel,
  isEdit,
  setIsEdit,
  reset,
  setToastConfig,
  hasDeleteButton,
  pathAPI,
  payloadAPI,
  redirectAPI,
  extraActionOnDelete = undefined,
  extraDescription = undefined,
}: DynamicRecordActionsProps): React.ReactElement {
  const { getLabel } = useLabels();
  const navigate = useNavigate();

  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    show: false,
    title: "",
    body: "",
  });

  const deleteRecord = () => {
    if (!pathAPI || !redirectAPI) return;

    setLoading(true);
    axios
      .post(pathAPI, payloadAPI)
      .then((res) => {
        console.log("DynamicRecordActions - Delete Record results:", res.data);
        if (res.data.result === 0) {
          setToastConfig({
            show: true,
            title: getLabel("TOAST.ERROR_TOAST_TITLE_LABEL") as string,
            body: getLabel("TOAST.ERROR_TOAST_BODY_LABEL") as string,
          });
        } else {
          navigate(redirectAPI);
          if (extraActionOnDelete) {
            extraActionOnDelete();
          }
        }
      })
      .catch((err) => {
        console.error("DynamicRecordActions - Error:", err);
        setToastConfig({
          show: true,
          title: getLabel("TOAST.ERROR_TOAST_TITLE_LABEL") as string,
          body:
            err?.response?.data?.detail ||
            (getLabel("TOAST.ERROR_TOAST_BODY_LABEL") as string),
        });
      })
      .finally(() => setLoading(false));
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
                title: getLabel(
                  "MODAL.DELETE.TITLE_MODAL_DELETE_LABEL",
                ) as string,
                body: getLabel(
                  "MODAL.DELETE.BODY_MODAL_DELETE_LABEL",
                ) as string,
              });
            }}
          >
            {getLabel("BUTTONS.DELETE_LABEL")}
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
          {getLabel("BUTTONS.SAVE_LABEL")}
        </Button>
        <Button
          className="ms-3 fw-medium"
          size="sm"
          onClick={() => {
            setIsEdit(false);
            reset();
          }}
        >
          {getLabel("BUTTONS.CANCEL_LABEL")}
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
      />
    </div>
  );
}
