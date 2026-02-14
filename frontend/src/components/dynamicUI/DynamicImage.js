import { useState, useEffect } from "react";
import {
  Form,
  FloatingLabel,
  Container,
  Row,
  Col,
  Image,
} from "react-bootstrap";
import { useLabels } from "../../config/Label";
import { API_BASE_URL } from "../../config/K";

/**
 * Shows an image with his name
 *
 * @param {String} props.fieldKey               - Fields key
 * @param {Object} props.info                   - Object with all the information of the field
 * @param {Function} props.fieldTypes           - Dictionary with the field type names
 * @param {Boolean} props.isNewForm             - Flag to understand which form is
 * @param {Boolean} props.isEdit                - Flag to understand if is in view or edit mode
 * @param {Object[]} props.errors               - Collection of errors messages (standard of react-hook-form)
 * @param {Function} props.register             - Function to register the form element (standard of react-hook-form)
 */
export default function DynamicImage({
  fieldKey,
  info,
  fieldTypes,
  isNewForm,
  isEdit,
  errors,
  register,
}) {
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
              type={fieldTypes.TEXT}
              required={info.is_required}
              defaultValue={isNewForm ? null : info?.value}
              disabled={isNewForm ? false : !info.is_editable || !isEdit}
              isInvalid={errors[fieldKey]}
              {...register(fieldKey, {
                required: {
                  value: info.is_required,
                  message: getLabel("FORM_ERRORS.MANDATORY_FIELD_LABEL"),
                },
                maxLength: {
                  value: info.length,
                  message: getLabel("FORM_ERRORS.MAX_FIELD_LABEL", {
                    max_length: info.length,
                  }),
                },
              })}
            />
            <Form.Control.Feedback type="invalid">
              {errors[fieldKey]?.message}
            </Form.Control.Feedback>
          </FloatingLabel>
        </Col>
      </Row>
    </Container>
  );
}
