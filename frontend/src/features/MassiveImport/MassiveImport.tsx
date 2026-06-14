import { useEffect, useMemo } from "react";
import { Button, Col,Container, Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";

import { FieldOptionLookup } from "@/types/field.types";
import { ENDPOINTS } from "@/api/endpoints";
import { ApiError, CRUDResult } from "@/api/types";
import { IMPORT_FIELD_STRUCTURE } from "@/config/K";
import { useAuth } from "@/context/Auth/Auth";
import { useLabels } from "@/context/Label/Label";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useFeedback } from "@/hooks/useFeedback";
import DynamicForm from "@/components/dynamicUI/DynamicForm/DynamicForm";
import LoadingScreen from "@/components/LoadingScreen/LoadingScreen";

const PREFIX = "MASSIVE_IMPORT";
const FORM_VALUES = Object.fromEntries(
  Object.entries(IMPORT_FIELD_STRUCTURE).map(([key, info]) => [
    key,
    info.value,
  ]),
);

export default function MassiveImport(): React.ReactElement | null {
  const { getLabel } = useLabels();
  const { user } = useAuth();
  const { getErrorMessage, showErrorToast, showSuccessToast } = useFeedback();
  const {
    data: options,
    loading: loadingForm,
    error: errorForm,
  } = useApiQuery<FieldOptionLookup[]>(ENDPOINTS.import.import);
  const { mutate, loading: loadingSubmit } = useApiMutation<
    FormData,
    CRUDResult
  >(ENDPOINTS.import.upload, "post");

  const loading = loadingForm || loadingSubmit;
  const fieldStructure = useMemo(() => {
    if (!options) return;

    const clonedFieldStructure = structuredClone(IMPORT_FIELD_STRUCTURE);
    clonedFieldStructure.object_name.options = options;
    return clonedFieldStructure;
  }, [options]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({ defaultValues: FORM_VALUES });

  useEffect(() => {
    if (errorForm) showErrorToast(errorForm, PREFIX);
  }, [errorForm, showErrorToast]);

  const onSubmit = async (data: Record<string, any>) => {
    const payload = new FormData();
    payload.append("operation_type", data["operation_type"]);
    payload.append("object_name", data["object_name"]);
    payload.append("user_id", String(user?.["id"]));
    payload.append("file", data["file"]?.[0]);

    try {
      await mutate(payload);
      showSuccessToast();
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.kind === "business_feature") {
        const errMessage = getErrorMessage(apiError, `${PREFIX}.ERRORS`);
        setError("file", {
          type: "manual",
          message: errMessage,
        });
      } else {
        showErrorToast(apiError, PREFIX);
      }
    }
  };

  if (loading)
    return (
      <div className="p-3">
        <LoadingScreen />
      </div>
    );

  if (!fieldStructure) return null;

  return (
    <Container className="p-3" fluid>
      <Row>
        <Col>
          <DynamicForm
            fields={fieldStructure}
            onSubmit={handleSubmit(onSubmit)}
            errors={errors}
            register={register}
            editability="byField"
          />
        </Col>
        <Col>
          <Form.Group controlId="formFile">
            <Form.Label>{getLabel("MASSIVE_IMPORT.UPLOAD_FILE")}</Form.Label>
            <Form.Control
              type="file"
              accept=".csv"
              required={true}
              isInvalid={!!errors["file"]}
              {...register("file", {
                required: {
                  value: true,
                  message: getLabel("FORM.ERRORS.MANDATORY_FIELD"),
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
            {getLabel("BUTTONS.CONFIRM")}
          </Button>
        </div>
      </Row>
    </Container>
  );
}
