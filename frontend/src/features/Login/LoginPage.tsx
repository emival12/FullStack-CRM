import { useState } from "react";
import { Button,Col, Container, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { ApiError } from "@/api/types";
import { LOGIN_FIELD_STRUCTURE, PATH_DATABASE } from "@/config/K";
import { useAuth } from "@/context/Auth/Auth";
import { useLabels } from "@/context/Label/Label";
import { useFeedback } from "@/hooks/useFeedback";
import DynamicForm from "@/components/dynamicUI/DynamicForm/DynamicForm";
import LoadingScreen from "@/components/LoadingScreen/LoadingScreen";

export default function LoginPage(): React.ReactElement {
  const { getLabel } = useLabels();
  const { login } = useAuth();
  const { showErrorToast } = useFeedback();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: Record<string, any>) => {
    setLoading(true);
    try {
      await login(data["email"], data["password"]);
      navigate(PATH_DATABASE);
    } catch (err) {
      showErrorToast(err as ApiError, "LOGIN");
    } finally {
      setLoading(false);
    }
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
              fields={LOGIN_FIELD_STRUCTURE}
              onSubmit={handleSubmit(onSubmit)}
              errors={errors}
              register={register}
              editability="byField"
            />
            <div className="d-flex justify-content-center pt-3">
              <Button
                className="fw-medium w-50"
                size="sm"
                type="submit"
                form="recordDetailForm"
              >
                {getLabel("BUTTONS.CONFIRM")}
              </Button>
            </div>
          </Col>
          <Col />
        </Row>
        <Row></Row>
      </Container>
    </>
  );
}
