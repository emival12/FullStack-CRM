import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Modal } from "react-bootstrap";

import {
  NEW_RECORD_TITLE_LABEL,
  SAVE_LABEL,
  ERROR_TOAST_BODY_LABEL,
  ERROR_TOAST_TITLE_LABEL,
} from "../../config/IT";
import { API_BASE_URL, PATH_INSERT } from "../../config/K";
import ToastMsg from "../../components/ToastMsg";
import RecordForm from "../TableRecordDetails/RecordForm";

/**
 * Shows a table of record
 *
 * @param {Object[]} props.selectedTable        - Table currently selected
 * @param {Object[]} props.showNewModal         - Flag to show or hide the modal
 * @param {Object[]} props.setShowNewModal      - Function to update flag to show or hide the modal
 * @param {Object[]} props.refreshData          - Function to run the refresh on the record list
 */
export default function NewRecord({
  selectedTableKey,
  showNewModal,
  setShowNewModal,
  refreshData,
}) {
  const [fields, setFields] = useState([]);
  const [validated, setValidated] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastTitle, setToastTitle] = useState();
  const [toastBody, setToastBody] = useState();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    if (!selectedTableKey) return; // Blocks execution if the selected tabel is not correct

    axios
      .get(API_BASE_URL + "/" + selectedTableKey + "/new-record")
      .then((res) => {
        console.log("Structure Record Received:", res.data);
        setFields(res.data);
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => {});
  }, []);

  //Method fired when the button Save is pressed
  const onSubmit = (data) => {
    const formPointer = document.getElementById("recordDetailForm");
    if (formPointer.checkValidity()) {
      axios
        .post(API_BASE_URL + PATH_INSERT, {
          table: selectedTableKey,
          record: data,
        })
        .then((res) => {
          console.log("Uploaded new record results:", res.data);
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

  return (
    <>
      <Modal show={showNewModal} onHide={() => setShowNewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{NEW_RECORD_TITLE_LABEL}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <RecordForm
            fields={fields}
            validated={validated}
            onSubmit={handleSubmit(onSubmit)}
            selectedTableKey={selectedTableKey}
            errors={errors}
            register={register}
            isNewForm={true}
            isEdit={null}
          ></RecordForm>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() =>
              document.getElementById("recordDetailForm").requestSubmit()
            }
          >
            {SAVE_LABEL}
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
