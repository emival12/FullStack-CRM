import axios from "axios";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import {
  BODY_MODAL_DELETE_LABEL,
  CANCEL_LABEL,
  DELETE_LABEL,
  ERROR_TOAST_BODY_LABEL,
  ERROR_TOAST_TITLE_LABEL,
  SAVE_LABEL,
  TITLE_MODAL_DELETE_LABEL,
} from "../../config/IT";
import ModalScreen from "../../components/ModalScreen";

/**
 * Shows a table of record
 *
 * @param {Object[]} props.setLoading         - Function to update the loading variable
 * @param {Object[]} props.setSelectedRecord  - Function to update the selectedRecord variable
 * @param {Object[]} props.editLabel          - Label used for the first button near the delete (generally is New or Edit)
 * @param {Object[]} props.isEdit             - Variable to understand if is in edit or in view
 * @param {Object[]} props.onEditClick        - Function to update the isEdit variable
 * @param {Object[]} props.reset              - Function used to refresh the form
 * @param {Object[]} props.setShowToast       - Function to update the showToast variable
 * @param {Object[]} props.setToastTitle      - Function to update the toastTitle variable
 * @param {Object[]} props.setToastBody       - Function to update the toastBody variable
 * @param {Object[]} props.hasDeleteButton    - Flag to decide if the deleted button is needed
 * @param {Object[]} props.pathAPI            - Path used in the API call
 * @param {Object[]} props.payloadAPI         - Payload used in the API call
 * @param {Object[]} props.redirectAPI        - Path used to redirect after the API success
 * @param {Object[]} props.extraDescription   - Variable with an optional text to be shown near the Delete/New buttons
 */
export default function RecordButtons({
  setLoading,
  setSelectedRecord,
  editLabel,
  isEdit,
  onEditClick,
  reset,
  setShowToast,
  setToastTitle,
  setToastBody,
  hasDeleteButton,
  pathAPI,
  payloadAPI,
  redirectAPI,
  extraDescription,
}) {
  const [showModal, setShowModal] = useState(false);
  const [titleModal, setTitleModal] = useState();
  const [bodyModal, setBodyModal] = useState();

  const navigate = useNavigate();

  const deleteRecord = () => {
    setLoading(true);
    axios
      .post(pathAPI, payloadAPI)
      .then((res) => {
        console.log("Deletion record results:", res.data);
        if (res.data.result == 0) {
          setShowToast(true);
          setToastTitle(ERROR_TOAST_TITLE_LABEL);
          setToastBody(ERROR_TOAST_BODY_LABEL);
        } else {
          setSelectedRecord(null);
          navigate(redirectAPI);
        }
      })
      .catch((err) => {
        console.error("Error:", err);

        setShowToast(true);
        setToastTitle(ERROR_TOAST_TITLE_LABEL);
        setToastBody(err.response.data.detail);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="d-flex flex-row-reverse justify-content-between align-items-center pb-2 pt-2">
      {!isEdit ? (
        <>
          <span>
            <Button
              className="ms-3 fw-medium"
              size="sm"
              onClick={() => onEditClick(true)}
            >
              {editLabel}
            </Button>
            <Button
              hidden={!hasDeleteButton}
              className="ms-3 fw-medium"
              size="sm"
              onClick={() => {
                setTitleModal(TITLE_MODAL_DELETE_LABEL);
                setBodyModal(BODY_MODAL_DELETE_LABEL);
                setShowModal(true);
              }}
            >
              {DELETE_LABEL}
            </Button>
          </span>
          <span>{extraDescription}</span>
        </>
      ) : (
        <span>
          <Button
            className="ms-3 fw-medium"
            size="sm"
            onClick={() =>
              document.getElementById("recordDetailForm").requestSubmit()
            }
          >
            {SAVE_LABEL}
          </Button>
          <Button
            className="ms-3 fw-medium"
            size="sm"
            onClick={() => {
              onEditClick(false);
              reset();
            }}
          >
            {CANCEL_LABEL}
          </Button>
        </span>
      )}

      <ModalScreen
        showModal={showModal}
        setShowModal={setShowModal}
        successFunction={deleteRecord}
        titleText={titleModal}
        bodyText={bodyModal}
      ></ModalScreen>
    </div>
  );
}
