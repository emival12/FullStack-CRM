import axios from "axios";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { useLabels } from "../../config/Label";
import ModalScreen from "../ModalScreen";

/**
 * Shows an Action bar with buttons (based on the configuration)
 *
 * @param {Function} props.setLoading         - Function to update the loading variable
 * @param {String} props.editLabel            - Label used for the first button near the delete (generally is New or Edit)
 * @param {Boolean} props.isEdit              - Variable to understand if is in edit or in view
 * @param {Function} props.setIsEdit          - Function to update the isEdit variable
 * @param {Function} props.reset              - Function used to refresh the form
 * @param {Object} props.setToastConfig       - Object with all the information to show the toast in case of error
 * @param {Object} props.hasDeleteButton      - Flag to decide if the deleted button is needed
 * @param {Object} props.pathAPI              - Path used in the API call
 * @param {Object} props.payloadAPI           - Payload used in the API call
 * @param {Object} props.redirectAPI          - Path used to redirect after the API success
 * @param {Function} props.extraActionOnDelete- Extra function with some extra actions to perform on delete
 * @param {Object} props.extraDescription     - Variable with an optional text to be shown near the Delete/New buttons
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
  extraActionOnDelete,
  extraDescription,
}) {
  const { getLabel } = useLabels();

  const navigate = useNavigate();
  const [modalConfig, setModalConfig] = useState({
    show: false,
    title: "",
    body: "",
  });

  const deleteRecord = () => {
    setLoading(true);
    axios
      .post(pathAPI, payloadAPI)
      .then((res) => {
        console.log("DynamicRecordActions - Delete Record results:", res.data);
        if (res.data.result === 0) {
          setToastConfig({
            show: true,
            title: getLabel("TOAST.ERROR_TOAST_TITLE_LABEL"),
            body: getLabel("TOAST.ERROR_TOAST_BODY_LABEL"),
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
          title: getLabel("TOAST.ERROR_TOAST_TITLE_LABEL"),
          body:
            err?.response?.data?.detail ||
            getLabel("TOAST.ERROR_TOAST_BODY_LABEL"),
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
                title: getLabel("MODAL.DELETE.TITLE_MODAL_DELETE_LABEL"),
                body: getLabel("MODAL.DELETE.BODY_MODAL_DELETE_LABEL"),
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
