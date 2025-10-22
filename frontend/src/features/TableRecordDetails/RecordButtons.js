import axios from "axios";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import {
  BODY_MODAL_DELETE_LABEL,
  CANCEL_LABEL,
  DELETE_LABEL,
  EDIT_LABEL,
  ERROR_TOAST_BODY_LABEL,
  ERROR_TOAST_TITLE_LABEL,
  SAVE_LABEL,
  TITLE_MODAL_DELETE_LABEL,
} from "../../config/IT";
import { API_BASE_URL, PATH_DATABASE, PATH_DELETE } from "../../config/K";
import ModalScreen from "../../components/ModalScreen";

/**
 * Shows a table of record
 *
 * @param {Object[]} props.setLoading         - Function to update the loading variable
 * @param {Object[]} props.selectedRecord     - Record currently selected
 * @param {Object[]} props.setSelectedRecord  - Function to update the selectedRecord variable
 * @param {Object[]} props.selectedTable      - Table currently selected
 * @param {Object[]} props.isEdit             - Variable to understand if is in edit or in view
 * @param {Object[]} props.onEditClick        - Function to update the isEdit variable
 * @param {Object[]} props.refreshRecord      - Variable to understand if is needed a refresh in the view
 * @param {Object[]} props.setRefreshRecord   - Function to update the refreshRecord variable
 * @param {Object[]} props.setShowToast       - Function to update the showToast variable
 * @param {Object[]} props.setToastTitle      - Function to update the toastTitle variable
 * @param {Object[]} props.setToastBody       - Function to update the toastBody variable
 */
export default function RecordButtons({
  setLoading,
  selectedRecord,
  setSelectedRecord,
  selectedTable,
  isEdit,
  onEditClick,
  refreshRecord,
  setRefreshRecord,
  setShowToast,
  setToastTitle,
  setToastBody,
}) {
  const [showModal, setShowModal] = useState(false);
  const [titleModal, setTitleModal] = useState();
  const [bodyModal, setBodyModal] = useState();

  const navigate = useNavigate();

  const deleteRecord = () => {
    setLoading(true);
    axios
      .post(API_BASE_URL + PATH_DELETE, {
        table: selectedTable?.key,
        id: selectedRecord?.record[selectedRecord?.primary_key],
      })
      .then((res) => {
        console.log("Deletion record results:", res.data);
        if (res.data.result == 0) {
          setShowToast(true);
          setToastTitle(ERROR_TOAST_TITLE_LABEL);
          setToastBody(ERROR_TOAST_BODY_LABEL);
        } else {
          setSelectedRecord(null);
          navigate(PATH_DATABASE + "/" + selectedTable.label);
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
    <div className="d-flex flex-row-reverse pb-2 pt-2">
      {!isEdit ? (
        <>
          <Button
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
          <Button
            className="ms-3 fw-medium"
            size="sm"
            onClick={() => onEditClick(true)}
          >
            {EDIT_LABEL}
          </Button>
        </>
      ) : (
        <>
          <Button
            className="ms-3 fw-medium"
            size="sm"
            onClick={() => {
              setRefreshRecord(!refreshRecord);
              onEditClick(false);
            }}
          >
            {CANCEL_LABEL}
          </Button>
          <Button
            className="ms-3 fw-medium"
            size="sm"
            onClick={() =>
              document.getElementById("recordDetailForm").requestSubmit()
            }
          >
            {SAVE_LABEL}
          </Button>
        </>
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
