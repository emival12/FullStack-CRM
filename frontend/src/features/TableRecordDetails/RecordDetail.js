import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useOutletContext, useParams } from "react-router-dom";
import { Form, FloatingLabel, Tab, Tabs } from "react-bootstrap";

import {
  ERROR_TOAST_BODY_LABEL,
  ERROR_TOAST_TITLE_LABEL,
  MANDATORY_FIELD_LABEL,
  MAX_FIELD_LABEL,
  MISSING_RECORD_LABEL,
} from "../../config/IT";
import { API_BASE_URL, PATH_UPDATE } from "../../config/K";
import MissingPage from "../../components/MissingPage";
import LoadingScreen from "../../components/LoadingScreen";
import RecordButtons from "./RecordButtons";
import ToastMsg from "../../components/ToastMsg";
import RecordsList from "../TableRecords/RecordsList";

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
  const [refreshRecord, setRefreshRecord] = useState(false);

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
    if (!selectedTableKey && !tableKey && !selectedRecord && !recordId) return; // Blocks execution if the selected tabel is not correct

    const actualTableKey = selectedTableKey || tableKey;
    const recordKey =
      selectedRecord?.record[selectedRecord?.primary_key] || recordId;

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
          Object.entries(res.data).map(([key, info]) => [key, info.value])
        );
        reset(formValues);
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, [selectedRecord, recordId, refreshRecord]); //rerun everything when one of those fields change

  //Method fired when the button Save is pressed
  const onSubmit = (data) => {
    var modified_data = {};
    for (const key in fields) {
      if (fields[key].value != data[key]) {
        modified_data[key] = data[key];
      }
    }

    if (Object.keys(modified_data).length > 0) {
      const formPointer = document.getElementById("recordDetailForm");
      if (formPointer.checkValidity()) {
        setLoading(true);
        axios
          .post(API_BASE_URL + PATH_UPDATE, {
            table: selectedTableKey,
            id: selectedRecord?.record[selectedRecord?.primary_key],
            field: modified_data,
          })
          .then((res) => {
            console.log("Updated record results:", res.data);
            if (res.data.result == 0) {
              setShowToast(true);
              setToastTitle(ERROR_TOAST_TITLE_LABEL);
              setToastBody(ERROR_TOAST_BODY_LABEL);
            } else {
              setRefreshRecord(!refreshRecord);
              setIsEdit(false);
            }
          })
          .catch((err) => {
            console.error("Error:", err);

            setShowToast(true);
            setToastTitle(ERROR_TOAST_TITLE_LABEL);
            setToastBody(err.response.data.detail);
          })
          .finally(() => setLoading(false));
      }

      setValidated(true);
    }
  };

  if (!selectedTableKey && !tableKey && !selectedRecord && !recordId) {
    return <MissingPage MissingText={MISSING_RECORD_LABEL} />;
  }

  if (loading) return <LoadingScreen />;

  const get_selection_entry = (key, info) => {
    return (
      <>
        <Form.Select
          defaultValue={info.value}
          disabled={!info.is_editable || !isEdit}
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
          defaultValue={info.value}
          disabled={!info.is_editable || !isEdit}
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
    <div>
      <Tabs
        defaultActiveKey="details"
        id="uncontrolled-tab-example"
        className="mb-3"
      >
        <Tab eventKey="details" title="Details">
          <RecordButtons
            setLoading={setLoading}
            selectedRecord={selectedRecord}
            setSelectedRecord={setSelectedRecord}
            selectedTableKey={selectedTableKey}
            isEdit={isEdit}
            onEditClick={setIsEdit}
            refreshRecord={refreshRecord}
            setRefreshRecord={setRefreshRecord}
            setShowToast={setShowToast}
            setToastTitle={setToastTitle}
            setToastBody={setToastBody}
          ></RecordButtons>
          <Form
            id="recordDetailForm"
            noValidate
            validated={validated}
            onSubmit={handleSubmit(onSubmit)}
          >
            {Object.entries(fields.field_structure).map(([key, info]) => (
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
          <ToastMsg
            showToast={showToast}
            setShowToast={setShowToast}
            color="danger"
            title={toastTitle}
            body={toastBody}
          ></ToastMsg>
        </Tab>
        <Tab eventKey="relatedLists" title="Related">
          {Object.entries(fields.related_list).map(([key, related_list]) => (
            <div key={key}>
              <p>{related_list.label}</p>
              {console.log(related_list)}
              <RecordsList
                records={related_list}
                selectedTableKey={selectedTableKey}
                onSelectedTable={setSelectedTableKey}
                onSelectedRecord={setSelectedRecord}
              />
            </div>
          ))}
        </Tab>
      </Tabs>
    </div>
  );
}
