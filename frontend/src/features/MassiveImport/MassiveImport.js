import axios from "axios";
import { useEffect, useState } from "react";
import { Container, Row, Form, Button, Col } from "react-bootstrap";
import { useForm } from "react-hook-form";

import {
  API_ERROR_MESSAGES,
  CONFIRM_LABEL,
  ERROR_TOAST_BODY_LABEL,
  ERROR_TOAST_TITLE_LABEL,
  MANDATORY_FIELD_LABEL,
  SUCCESS_TOAST_BODY_LABEL,
  SUCCESS_TOAST_TITLE_LABEL,
  UPLOAD_FILE_LABEL,
} from "../../config/IT";
import { API_BASE_URL, PATH_IMPORT } from "../../config/K";
import { IMPORT_FIELD_STRUCTURE } from "./K_Import";
import LoadingScreen from "../../components/LoadingScreen";
import RecordForm from "../TableRecordDetails/RecordForm";
import ToastMsg from "../../components/ToastMsg";

export default function MassiveImport() {
  const [loading, setLoading] = useState(false);
  const [fieldStructure, setFieldStructure] = useState([]);
  const [validated, setValidated] = useState(false);

  const [toastColor, setToastColor] = useState("danger");
  const [showToast, setShowToast] = useState(false);
  const [toastTitle, setToastTitle] = useState();
  const [toastBody, setToastBody] = useState();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm();

  const fetchData = () => {
    setLoading(true);
    setValidated(false);
    axios
      .get(API_BASE_URL + PATH_IMPORT)
      .then((res) => {
        console.log("Massive Import Data Received:", res.data);
        IMPORT_FIELD_STRUCTURE.Object_name.options = res.data;
        setFieldStructure(structuredClone(IMPORT_FIELD_STRUCTURE));

        //use to handle the values and redraw it
        const formValues = Object.fromEntries(
          Object.entries(IMPORT_FIELD_STRUCTURE).map(([key, info]) => [
            key,
            info.value,
          ]),
        );
        reset(formValues);
      })
      .catch((err) => {
        console.error("Error:", err);
        setShowToast(true);
        setToastTitle(ERROR_TOAST_TITLE_LABEL);
        setToastBody(err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = (data) => {
    const formPointer = document.getElementById("recordDetailForm");
    if (formPointer.checkValidity()) {
      setLoading(true);

      const formData = new FormData();
      formData.append("operation_type", data["Operation_type"]);
      formData.append("object_name", data["Object_name"]);
      formData.append("file", data["file"][0]);

      axios
        .post(API_BASE_URL + PATH_IMPORT + "/Upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((res) => {
          console.log("Updated record results:", res.data);

          setToastColor("success");
          setToastTitle(SUCCESS_TOAST_TITLE_LABEL);
          setToastBody(SUCCESS_TOAST_BODY_LABEL);
          setShowToast(true);
        })
        .catch((err) => {
          console.error("Error:", err);

          if (err.response.status == 400) {
            console.log(err.response.data.detail);
            const errorCode = err.response.data.detail.error_code;
            const errorData = err.response.data.detail.error_data;
            const messageBuilder = API_ERROR_MESSAGES[errorCode];

            setError("file", {
              type: "manual",
              message: messageBuilder(errorData),
            });
          } else {
            setToastTitle(ERROR_TOAST_TITLE_LABEL);
            setToastBody(err.response.data.detail);
            setShowToast(true);
          }
          setToastColor("danger");
        })
        .finally(() => setLoading(false));
    } else {
      reset();
    }

    setValidated(true);
  };

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Container className="p-3" fluid>
        <Row>
          <Col>
            <RecordForm
              fields={fieldStructure}
              validated={validated}
              onSubmit={handleSubmit(onSubmit)}
              selectedTableKey={null}
              errors={errors}
              register={register}
              isNewForm={false}
              isEdit={true}
            ></RecordForm>
          </Col>
          <Col>
            <Form.Group controlId="formFile">
              <Form.Label>{UPLOAD_FILE_LABEL}</Form.Label>
              <Form.Control
                type="file"
                accept=".csv"
                required={true}
                isInvalid={errors["file"]}
                {...register("file", {
                  required: {
                    value: true,
                    message: MANDATORY_FIELD_LABEL,
                  },
                })}
              />
              <Form.Control.Feedback type="invalid">
                {errors["file"]?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <div className="d-flex flex-row-reverse pt-5">
            <Button
              className="ms-3 fw-medium"
              size="sm"
              onClick={() =>
                document.getElementById("recordDetailForm").requestSubmit()
              }
            >
              {CONFIRM_LABEL}
            </Button>
          </div>
        </Row>
      </Container>
      <ToastMsg
        showToast={showToast}
        setShowToast={setShowToast}
        color={toastColor}
        title={toastTitle}
        body={toastBody}
      ></ToastMsg>
    </>
  );
}
