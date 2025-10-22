import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Modal, Form, FloatingLabel } from "react-bootstrap";

import {
  NEW_RECORD_TITLE_LABEL,
  SAVE_LABEL,
  MANDATORY_FIELD_LABEL,
  MAX_FIELD_LABEL,
  ERROR_TOAST_BODY_LABEL,
  ERROR_TOAST_TITLE_LABEL,
} from "../../config/IT";
import { API_BASE_URL, PATH_INSERT } from "../../config/K";
import ToastMsg from "../../components/ToastMsg";

/**
 * Shows a table of record
 *
 * @param {Object[]} props.selectedTable        - Table currently selected
 * @param {Object[]} props.showNewModal         - Flag to show or hide the modal
 * @param {Object[]} props.setShowNewModal      - Function to update flag to show or hide the modal
 * @param {Object[]} props.setRefreshList       - Function to run the refresh on the record list
 */
export default function NewRecord({
  selectedTableKey,
  showNewModal,
  setShowNewModal,
  setRefreshList,
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
            setRefreshList(true);
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

  const get_selection_entry = (key, info) => {
    return (
      <>
        <Form.Select
          defaultValue={
            info.reference_field == "record_type_name"
              ? selectedTableKey.split("_")[1]
              : "NULL"
          }
          disabled={info.reference_field == "record_type_name"}
          isInvalid={errors[key]}
          {...register(key, {
            validate: (value) =>
              !info.is_required || value !== "NULL" || MANDATORY_FIELD_LABEL,
          })}
        >
          <option value="NULL"></option>
          {info.options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.reference_field}
            </option>
          ))}
        </Form.Select>
        <Form.Control.Feedback type="invalid">
          {errors[key]?.message}
        </Form.Control.Feedback>
      </>
    );
  };

  const get_entry = (key, info) => {
    return (
      <>
        <Form.Control
          type={info.field_type}
          required={info.is_required}
          isInvalid={errors[key]}
          step="0.01"
          {...register(key, {
            required: {
              value: info.is_required,
              message: MANDATORY_FIELD_LABEL,
            },
            maxLength: {
              value: info.length,
              message: MAX_FIELD_LABEL.replace("X", info.length),
            },
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors[key]?.message}
        </Form.Control.Feedback>
      </>
    );
  };

  return (
    <>
      <Modal show={showNewModal} onHide={() => setShowNewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{NEW_RECORD_TITLE_LABEL}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form
            id="recordDetailForm"
            noValidate
            validated={validated}
            onSubmit={handleSubmit(onSubmit)}
          >
            {Object.entries(fields).map(([key, info]) => (
              <FloatingLabel
                key={key}
                controlId="floatingInput"
                label={key.replace("_", " ") + (info.is_required ? " *" : "")}
                className="mb-3"
              >
                {info.field_type === "picklist" || info.field_type === "lookup"
                  ? get_selection_entry(key, info)
                  : get_entry(key, info)}
              </FloatingLabel>
            ))}
          </Form>
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
