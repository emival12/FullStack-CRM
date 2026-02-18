import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { Container, Row, Form, Button, Col } from "react-bootstrap";
import { useForm } from "react-hook-form";
import {
  FieldOptionLookup,
  MetadataFieldStructure,
  ToastConfig,
} from "commot.types";
import { DataFieldStructure } from "components/dynamicUI/DynamicForm/DynamicForm.types";

import {
  API_BASE_URL,
  PATH_IMPORT,
  PATH_UPLOAD,
  IMPORT_FIELD_STRUCTURE,
} from "config/K";
import { useAuth } from "context/Auth/Auth";
import { useLabels } from "context/Label/Label";
import DynamicForm from "components/dynamicUI/DynamicForm/DynamicForm";
import LoadingScreen from "components/LoadingScreen/LoadingScreen";
import ToastMsg from "components/ToastMsg/ToastMsg";

export default function MassiveImport(): React.ReactElement {
  const { user } = useAuth();
  const { getLabel } = useLabels();

  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [fieldStructure, setFieldStructure] = useState<MetadataFieldStructure>(
    {},
  );

  const [toastConfig, setToastConfig] = useState<ToastConfig>({
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
      .get<FieldOptionLookup[]>(API_BASE_URL + PATH_IMPORT)
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
          title: getLabel("TOAST.ERROR_TOAST_TITLE_LABEL"),
          body: err.message,
          color: "danger",
        });
      })
      .finally(() => setLoading(false));
  }, [reset, getLabel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = (data: Record<string, any>) => {
    setLoading(true);

    const formData = new FormData();
    formData.append("operation_type", data["operation_type"]);
    formData.append("object_name", data["object_name"]);
    formData.append("user_id", String(user?.["id"]));
    formData.append("file", data["file"]?.[0]);

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
          title: getLabel("TOAST.SUCCESS_TOAST_TITLE_LABEL"),
          body: getLabel("TOAST.SUCCESS_TOAST_BODY_LABEL"),
          color: "success",
        });
        setValidated(false);
      })
      .catch((err) => {
        console.error("MassiveImport - Error:", err);
        if (err.response.status === 400) {
          const errorCode = err.response.data.detail.error_code;
          const errorData = err.response.data.detail.error_data;
          const message = getLabel(
            `API_MASSIVE_IMPORT_ERROR_MESSAGES.${errorCode}`,
            errorData,
          );

          setError("file", {
            type: "manual",
            message: message,
          });
        } else {
          setToastConfig({
            show: true,
            title: getLabel("TOAST.ERROR_TOAST_TITLE_LABEL"),
            body:
              err?.response?.data?.detail ||
              getLabel("TOAST.ERROR_TOAST_BODY_LABEL"),
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
              fields={fieldStructure as DataFieldStructure}
              validated={validated}
              onSubmit={handleSubmit(onSubmit)}
              errors={errors}
              register={register}
              isNewForm={false}
              isEdit={true}
            />
          </Col>
          <Col>
            <Form.Group controlId="formFile">
              <Form.Label>{getLabel("MASSIVE.UPLOAD_FILE_LABEL")}</Form.Label>
              <Form.Control
                type="file"
                accept=".csv"
                required={true}
                isInvalid={!!errors["file"]}
                {...register("file", {
                  required: {
                    value: true,
                    message: getLabel("FORM_ERRORS.MANDATORY_FIELD_LABEL"),
                  },
                })}
              />
              <Form.Control.Feedback
                type="invalid"
                style={{ whiteSpace: "pre-line" }}
              >
                {errors["file"]?.message?.toString()}
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
              {getLabel("BUTTONS.CONFIRM_LABEL")}
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
