import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { Container, Row, Form, Button, Col } from "react-bootstrap";
import { useForm } from "react-hook-form";

import {
  API_ERROR_MESSAGES,
  CONFIRM_LABEL,
  ERROR_TOAST_TITLE_LABEL,
  MANDATORY_FIELD_LABEL,
  SUCCESS_TOAST_BODY_LABEL,
  SUCCESS_TOAST_TITLE_LABEL,
  UPLOAD_FILE_LABEL,
} from "../../config/IT";
import { API_BASE_URL, PATH_IMPORT, PATH_UPLOAD } from "../../config/K";
import { IMPORT_FIELD_STRUCTURE } from "./K_Import";
import LoadingScreen from "../../components/LoadingScreen";
import ToastMsg from "../../components/ToastMsg";
import DynamicForm from "../../components/dynamicUI/DynamicForm";

export default function MassiveImport() {
  const [loading, setLoading] = useState(false);
  const [fieldStructure, setFieldStructure] = useState([]);
  const [validated, setValidated] = useState(false);

  const [toastConfig, setToastConfig] = useState({
    show: false,
    title: "",
    body: "",
    color: "danger",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm();

  const fetchData = useCallback(() => {
    setLoading(true);
    setValidated(false);
    axios
      .get(API_BASE_URL + PATH_IMPORT)
      .then((res) => {
        console.log("MassiveImport - Data Received:", res.data);
        let clonedFieldStructure = structuredClone(IMPORT_FIELD_STRUCTURE);
        clonedFieldStructure.object_name.options = res.data;
        setFieldStructure(clonedFieldStructure);

        //Insert the options retrieved into the form and redraw it
        const formValues = Object.fromEntries(
          Object.entries(IMPORT_FIELD_STRUCTURE).map(([key, info]) => [
            key,
            info.value,
          ]),
        );
        reset(formValues);
      })
      .catch((err) => {
        console.error("MassiveImport - Error:", err);
        setToastConfig({
          show: true,
          title: ERROR_TOAST_TITLE_LABEL,
          body: err.message,
          color: "danger",
        });
      })
      .finally(() => setLoading(false));
  }, [reset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = (data) => {
    setLoading(true);

    const formData = new FormData();
    formData.append("operation_type", data["operation_type"]);
    formData.append("object_name", data["object_name"]);
    formData.append("file", data["file"][0]);

    const headers = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    axios
      .post(API_BASE_URL + PATH_IMPORT + PATH_UPLOAD, formData, headers)
      .then((res) => {
        console.log("MassiveImport - Updated record results:", res.data);
        setToastConfig({
          show: true,
          title: SUCCESS_TOAST_TITLE_LABEL,
          body: SUCCESS_TOAST_BODY_LABEL,
          color: "success",
        });
        setValidated(false);
      })
      .catch((err) => {
        console.error("MassiveImport - Error:", err);
        if (err.response.status === 400) {
          const errorCode = err.response.data.detail.error_code;
          const errorData = err.response.data.detail.error_data;
          const messageBuilder = API_ERROR_MESSAGES[errorCode];

          setError("file", {
            type: "manual",
            message: messageBuilder(errorData),
          });
        } else {
          setToastConfig({
            show: true,
            title: ERROR_TOAST_TITLE_LABEL,
            body: err.response.data.detail,
            color: "danger",
          });
        }
      })
      .finally(() => setLoading(false));

    setValidated(true);
  };

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Container className="p-3" fluid>
        <Row>
          <Col>
            <DynamicForm
              fields={fieldStructure}
              validated={validated}
              onSubmit={handleSubmit(onSubmit)}
              tableKey={null}
              errors={errors}
              register={register}
              isNewForm={false}
              isEdit={true}
            />
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
              type="submit"
              form="recordDetailForm"
            >
              {CONFIRM_LABEL}
            </Button>
          </div>
        </Row>
      </Container>
      <ToastMsg
        showToast={toastConfig.show}
        setShowToast={(val) => setToastConfig({ ...toastConfig, show: val })}
        color={toastConfig.color}
        title={toastConfig.title}
        body={toastConfig.body}
      />
    </>
  );
}
