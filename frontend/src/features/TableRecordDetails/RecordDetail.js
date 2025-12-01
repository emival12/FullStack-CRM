import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useOutletContext, useParams, useNavigate } from "react-router-dom";
import { Tab, Tabs } from "react-bootstrap";

import {
  DETAIL_TAB_LABEL,
  EDIT_LABEL,
  ERROR_TOAST_BODY_LABEL,
  ERROR_TOAST_TITLE_LABEL,
  MISSING_RECORD_LABEL,
  RELATED_TAB_LABEL,
} from "../../config/IT";
import {
  API_BASE_URL,
  ERROR_MISSING_RECORD,
  ERROR_MISSING_TABLE,
  PATH_DATABASE,
  PATH_DELETE,
  PATH_UPDATE,
} from "../../config/K";
import MissingPage from "../../components/MissingPage";
import LoadingScreen from "../../components/LoadingScreen";
import RecordButtons from "./RecordButtons";
import ToastMsg from "../../components/ToastMsg";
import RecordsList from "../TableRecords/RecordsList";
import RecordForm from "./RecordForm";

export default function RecordDetail() {
  const { tableKey, recordId } = useParams();
  const {
    selectedTableKey,
    setSelectedTableKey,
    selectedRecord,
    setSelectedRecord,
  } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [validated, setValidated] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastTitle, setToastTitle] = useState();
  const [toastBody, setToastBody] = useState();

  const [controlledError, setControlledError] = useState(false);

  const actualTableKey = selectedTableKey || tableKey;
  const recordKey =
    selectedRecord?.record[selectedRecord?.primary_key] || recordId;

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const fetchData = () => {
    if (!actualTableKey && !recordKey) return; // Blocks execution if the selected tabel is not correct

    setLoading(true);
    setIsEdit(false);
    setValidated(false);
    axios
      .get(API_BASE_URL + "/" + actualTableKey + "/record/" + recordKey)
      .then((res) => {
        console.log("Field List Received:", res.data);
        setFields(res.data);

        //use to handle the values and redraw it
        const formValues = Object.fromEntries(
          Object.entries(res.data.field_structure).map(([key, info]) => [
            key,
            info.value,
          ])
        );
        reset(formValues);
      })
      .catch((err) => {
        console.error("Error:", err);
        const errMsg = err.response.data.detail;
        if (
          errMsg === ERROR_MISSING_TABLE.replace("X", actualTableKey) ||
          errMsg === ERROR_MISSING_RECORD.replace("X", recordKey)
        ) {
          setControlledError(true);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [selectedRecord, recordId]); //rerun everything when one of those fields change

  //Method fired when the button Save is pressed
  const onSubmit = (data) => {
    let modified_data = {};
    let new_PK = null;
    for (const key in fields.field_structure) {
      if (fields.field_structure[key].value != data[key]) {
        modified_data[key] = data[key];
        new_PK =
          key.toLowerCase() == fields.primary_key_name.toLowerCase()
            ? data[key]
            : null;
      }
    }

    if (Object.keys(modified_data).length > 0) {
      const formPointer = document.getElementById("recordDetailForm");
      if (formPointer.checkValidity()) {
        setLoading(true);
        axios
          .post(API_BASE_URL + PATH_UPDATE, {
            table: actualTableKey,
            id: recordKey,
            field: modified_data,
          })
          .then((res) => {
            console.log("Updated record results:", res.data);
            if (res.data.result == 0) {
              setShowToast(true);
              setToastTitle(ERROR_TOAST_TITLE_LABEL);
              setToastBody(ERROR_TOAST_BODY_LABEL);
            } else {
              if (new_PK) {
                navigate(PATH_DATABASE + "/" + actualTableKey + "/" + new_PK);
              } else {
                fetchData();
                setIsEdit(false);
              }
            }
          })
          .catch((err) => {
            console.error("Error:", err);

            setShowToast(true);
            setToastTitle(ERROR_TOAST_TITLE_LABEL);
            setToastBody(err.response.data.detail);
          })
          .finally(() => setLoading(false));
      } else {
        reset();
        setIsEdit(false);
      }

      setValidated(true);
    }
  };

  if (controlledError) {
    return <MissingPage MissingText={MISSING_RECORD_LABEL} />;
  }

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <Tabs
        defaultActiveKey="details"
        id="uncontrolled-tab-example"
        className="mb-3"
      >
        <Tab eventKey="details" title={DETAIL_TAB_LABEL}>
          <RecordButtons
            setLoading={setLoading}
            setSelectedRecord={setSelectedRecord}
            editLabel={EDIT_LABEL}
            isEdit={isEdit}
            onEditClick={setIsEdit}
            reset={reset}
            setShowToast={setShowToast}
            setToastTitle={setToastTitle}
            setToastBody={setToastBody}
            hasDeleteButton={true}
            pathAPI={API_BASE_URL + PATH_DELETE}
            payloadAPI={{
              table: actualTableKey,
              id: recordKey,
            }}
            redirectAPI={PATH_DATABASE + "/" + actualTableKey}
            extraDescription={null}
          ></RecordButtons>
          <RecordForm
            fields={fields.field_structure}
            validated={validated}
            onSubmit={handleSubmit(onSubmit)}
            selectedTableKey={actualTableKey}
            errors={errors}
            register={register}
            isNewForm={false}
            isEdit={isEdit}
          ></RecordForm>
          <ToastMsg
            showToast={showToast}
            setShowToast={setShowToast}
            color="danger"
            title={toastTitle}
            body={toastBody}
          ></ToastMsg>
        </Tab>
        {fields.related_list.length > 0 ? (
          <Tab eventKey="relatedLists" title={RELATED_TAB_LABEL}>
            {Object.entries(fields.related_list).map(([key, related_list]) => (
              <div className="border border-2 p-3 pt-2 rounded-4" key={key}>
                <div className="fw-bold mb-2">{related_list.label}</div>
                <RecordsList
                  records={related_list}
                  selectedTableKey={actualTableKey}
                  onSelectedTable={setSelectedTableKey}
                  onSelectedRecord={setSelectedRecord}
                />
              </div>
            ))}
          </Tab>
        ) : null}
      </Tabs>
    </div>
  );
}
