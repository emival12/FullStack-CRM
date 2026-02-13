import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Modal } from "react-bootstrap";

import { API_BASE_URL, PATH_INSERT } from "../../config/K";
import { useAuth } from "../../context/AuthContext";
import { useLabels } from "../../config/Label";
import ToastMsg from "../../components/ToastMsg";
import DynamicForm from "../../components/dynamicUI/DynamicForm";

/**
 * Shows a modal with all the field of the object in order to create a new record
 *
 * @param {String} props.tableKey               - Table currently selected
 * @param {Boolean} props.showNewModal          - Flag to show or hide the modal
 * @param {Function} props.setShowNewModal      - Function to update flag to show or hide the modal
 * @param {Function} props.refreshData          - Function to run the refresh on the record list
 */
export default function NewRecord({
  tableKey,
  showNewModal,
  setShowNewModal,
  refreshData,
}) {
  const { getLabel } = useLabels();

  const [fields, setFields] = useState([]);
  const [validated, setValidated] = useState(false);

  const [toastConfig, setToastConfig] = useState({
    show: false,
    title: "",
    body: "",
  });

  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    if (!tableKey) return; // Blocks execution if the selected tabel is not correct

    axios
      .get(`${API_BASE_URL}/${tableKey}/new-record`)
      .then((res) => {
        console.log("NewRecord - Structure Record Received:", res.data);
        setFields(res.data);
      })
      .catch((err) => console.error("NewRecord - Error:", err))
      .finally(() => {});
  }, [tableKey]);

  //Method fired when the button Save is pressed
  const onSubmit = (data) => {
    axios
      .post(`${API_BASE_URL}${PATH_INSERT}`, {
        table: tableKey,
        record: data,
        user: user,
      })
      .then((res) => {
        console.log(
          "NewRecord - Sumbit - Uploaded new record results:",
          res.data,
        );
        if (res.data.result === 0) {
          setToastConfig({
            show: true,
            title: getLabel("TOAST.ERROR_TOAST_TITLE_LABEL"),
            body: getLabel("TOAST.ERROR_TOAST_BODY_LABEL"),
          });
        } else {
          setValidated(false);
          setShowNewModal(false);
          refreshData();
          reset();
        }
      })
      .catch((err) => {
        console.error("NewRecord - Sumbit - Error:", err);
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

  return (
    <>
      <Modal
        show={showNewModal}
        onHide={() => {
          setShowNewModal(false);
          reset();
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {getLabel("MODAL.INSERT.NEW_RECORD_TITLE_LABEL")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DynamicForm
            fields={fields}
            validated={validated}
            onSubmit={handleSubmit(onSubmit)}
            tableKey={tableKey}
            errors={errors}
            register={register}
            isNewForm={true}
            isEdit={null}
          />
        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" type="submit" form="recordDetailForm">
            {getLabel("BUTTONS.SAVE_LABEL")}
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
