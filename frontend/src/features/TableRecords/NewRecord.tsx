import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Modal } from "react-bootstrap";
import type { ToastConfig } from "commot.types";
import type { NewRecordProps } from "./TableRecors.types";
import type { DataFieldStructure } from "components/dynamicUI/DynamicForm/DynamicForm.types";

import { API_BASE_URL, PATH_INSERT } from "config/K";
import { useAuth } from "context/Auth/Auth";
import { useLabels } from "context/Label/Label";
import ToastMsg from "components/ToastMsg/ToastMsg";
import DynamicForm from "components/dynamicUI/DynamicForm/DynamicForm";

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

  const [fields, setFields] = useState<DataFieldStructure>({});
  const [validated, setValidated] = useState(false);

  const [toastConfig, setToastConfig] = useState<ToastConfig>({
    show: false,
    title: "",
    body: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    if (!tableKey) return; // Blocks execution if the selected tabel is not correct

    axios
      .get<DataFieldStructure>(`${API_BASE_URL}/${tableKey}/new-record`)
      .then((res) => {
        console.log("NewRecord - Structure Record Received:", res.data);
        setFields(res.data);
      })
      .catch((err) => console.error("NewRecord - Error:", err))
      .finally(() => {});
  }, [tableKey]);

  //Method fired when the button Save is pressed
  const onSubmit = (data: Record<string, any>) => {
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
        title={toastConfig.title}
        body={toastConfig.body}
      />
    </>
  );
}
