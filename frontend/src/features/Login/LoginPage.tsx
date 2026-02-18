import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Button } from "react-bootstrap";
import type { ToastConfig } from "commot.types";
import type { DataFieldStructure } from "components/dynamicUI/DynamicForm/DynamicForm.types";

import { useAuth } from "context/Auth/Auth";
import { useLabels } from "context/Label/Label";
import { LOGIN_FIELD_STRUCTURE, PATH_DATABASE } from "config/K";
import DynamicForm from "components/dynamicUI/DynamicForm/DynamicForm";
import ToastMsg from "components/ToastMsg/ToastMsg";
import LoadingScreen from "components/LoadingScreen/LoadingScreen";

export default function LoginPage(): React.ReactElement {
  const { login } = useAuth();
  const { getLabel } = useLabels();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [validated] = useState(false);
  const [toastConfig, setToastConfig] = useState<ToastConfig>({
    show: false,
    title: "",
    body: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data: Record<string, any>) => {
    setLoading(true);
    login(data["email"], data["password"])
      .then((res) => {
        console.log("LoginPage - result:", res.data);
        navigate(PATH_DATABASE);
      })
      .catch((err) => {
        console.error("LoginPage - Error:", err);
        if (err?.response?.status === 401) {
          const errorCode = err.response.data?.detail?.error_code;
          const message = getLabel(`LOGIN.${errorCode}`);
          setToastConfig({
            show: true,
            title: getLabel("TOAST.ERROR_TOAST_TITLE_LABEL"),
            body: message,
          });
        } else {
          setToastConfig({
            show: true,
            title: getLabel("TOAST.ERROR_TOAST_TITLE_LABEL"),
            body:
              err?.response?.data?.detail ||
              getLabel("TOAST.ERROR_TOAST_BODY_LABEL"),
          });
        }
      })
      .finally(() => setLoading(false));
  };

  if (loading)
    return (
      <div className="min-vh-100 d-flex flex-column">
        <LoadingScreen />
      </div>
    );

  return (
    <>
      <Container fluid>
        <Row className="min-vh-100 align-items-center">
          <Col />
          <Col>
            <DynamicForm
              fields={LOGIN_FIELD_STRUCTURE as DataFieldStructure}
              validated={validated}
              onSubmit={handleSubmit(onSubmit)}
              errors={errors}
              register={register}
              isNewForm={false}
              isEdit={true}
            />
            <div className="d-flex justify-content-center pt-3">
              <Button
                className="fw-medium w-50"
                size="sm"
                type="submit"
                form="recordDetailForm"
              >
                {getLabel("BUTTONS.CONFIRM_LABEL")}
              </Button>
            </div>
          </Col>
          <Col />
        </Row>
        <Row></Row>
      </Container>
      <ToastMsg
        showToast={toastConfig.show}
        setShowToast={(val) => setToastConfig({ ...toastConfig, show: val })}
        title={toastConfig.title}
        body={toastConfig.body}
      />
    </>
  );
}
