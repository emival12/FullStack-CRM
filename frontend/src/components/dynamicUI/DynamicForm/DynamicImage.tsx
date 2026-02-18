import { useState, useEffect } from "react";
import {
  Form,
  FloatingLabel,
  Container,
  Row,
  Col,
  Image,
} from "react-bootstrap";
import { FieldType } from "commot.types";
import type { DynamicImageProps } from "./DynamicForm.types";

import { useLabels } from "context/Label/Label";
import { API_BASE_URL } from "config/K";

/**
 * Shows an image with his name
 */
export default function DynamicImage({
  fieldKey,
  info,
  isNewForm,
  isEdit,
  errors,
  register,
}: DynamicImageProps): React.ReactElement {
  const { getLabel } = useLabels();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [info?.value]);

  return (
    <Container fluid className="mb-3 p-0">
      <Row className="align-items-center">
        <Col xs={12} md={8} className="d-flex justify-content-center">
          {!imgError ? (
            <Image
              src={`${API_BASE_URL}/images/${info?.value}`}
              fluid
              rounded
              onError={() => setImgError(true)}
              style={{ maxHeight: "300px" }}
            />
          ) : (
            <div>{getLabel("FORM_ERRORS.IMAGE_NOT_FOUND")}</div>
          )}
        </Col>
        <Col>
          <FloatingLabel
            controlId={`floating-${fieldKey}`}
            label={
              fieldKey.replaceAll("_", " ") + (info.is_required ? " *" : "")
            }
          >
            <Form.Control
              type={FieldType.TEXT}
              required={!!info.is_required}
              defaultValue={isNewForm ? null : info?.value}
              disabled={isNewForm ? false : !info.is_editable || !isEdit}
              isInvalid={!!errors[fieldKey]}
              {...register(fieldKey, {
                required: {
                  value: !!info.is_required,
                  message: getLabel(
                    "FORM_ERRORS.MANDATORY_FIELD_LABEL",
                  ) as string,
                },
                maxLength: {
                  value: Number(info.length),
                  message: getLabel("FORM_ERRORS.MAX_FIELD_LABEL", {
                    max_length: String(info.length ?? ""),
                  }) as string,
                },
              })}
            />
            <Form.Control.Feedback type="invalid">
              {errors[fieldKey]?.message?.toString()}
            </Form.Control.Feedback>
          </FloatingLabel>
        </Col>
      </Row>
    </Container>
  );
}
