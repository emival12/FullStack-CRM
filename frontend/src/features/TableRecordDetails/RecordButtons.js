import axios from "axios";
import { useState } from "react";
import { Button } from "react-bootstrap";

import {
  BODY_MODAL_DELETE_LABEL,
  CANCEL_LABEL,
  DELETE_LABEL,
  EDIT_LABEL,
  SAVE_LABEL,
  TITLE_MODAL_DELETE_LABEL,
} from "../../config/IT";
import { API_BASE_URL, PATH_DELETE } from "../../config/K";
import ModalScreen from "../../components/ModalScreen";

export default function RecordButtons({
  setLoading,
  selectedRecord,
  selectedTable,
  isEdit,
  onEditClick,
  refreshRecord,
  setRefreshRecord,
}) {
  const [showModal, setShowModal] = useState(false);
  const [titleModal, setTitleModal] = useState();
  const [bodyModal, setBodyModal] = useState();

  const deleteRecord = () => {
    setLoading(true);
    axios
      .post(API_BASE_URL + PATH_DELETE, {
        table: selectedTable?.key,
        id: selectedRecord?.id,
      })
      .then((res) => {
        console.log("Deletion record results:", res.data);
      })
      .catch((err) => console.error("Error:", err))
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
