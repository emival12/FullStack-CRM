import {
  Form,
  FloatingLabel,
  Container,
  Row,
  Col,
  Image,
} from "react-bootstrap";
import TextareaAutosize from "react-textarea-autosize";
import { useLabels } from "../../config/Label";
import { API_BASE_URL } from "../../config/K";

/**
 * Shows a form with some fields
 *
 * @param {Object[]} props.fields               - Fields to show
 * @param {Object} props.validated              - Flag to show or hide the validations
 * @param {Function} props.onSubmit             - Function to use on submit
 * @param {Object} props.tableKey               - Key of the selected table
 * @param {Object[]} props.errors               - Collection of errors messages (standard of react-hook-form)
 * @param {Function} props.register             - Function to register the form element (standard of react-hook-form)
 * @param {Object} props.isNewForm              - Flag to understand which form is
 * @param {Object} props.isEdit                 - Flag to understand if is in view or edit mode
 */
/**
 * Fields structure:
 * {
 *   "Field_name_1": {
 *       Description field
 *       "field_type": "...",
 *       "length": ...,
 *       "is_editable": ...,
 *       ....
 *       IF IS A PICKLIST OR LOOKUP THERE IS ALSO AN OPTION SECTION
 *       "options": [
 *           {
 *               "reference_field": "....",
 *               "id": "...."
 *           },
 *           ....
 *       ]
 *   },
 *   ....
 * }
 */
export default function DynamicForm({
  fields,
  validated,
  onSubmit,
  tableKey,
  errors,
  register,
  isNewForm,
  isEdit,
}) {
  const { getLabel } = useLabels();
  const fieldTypes = {
    TEXT: "text",
    PICKLIST: "picklist",
    LOOKUP: "lookup",
    RADIO: "radio",
    CHECKBOX: "checkbox",
    IMG: "image",
  };

  const renderField = (key, info) => {
    if (
      info.field_type === fieldTypes.PICKLIST ||
      info.field_type === fieldTypes.LOOKUP
    ) {
      return get_selection_entry(key, info);
    } else if (info.field_type === fieldTypes.RADIO) {
      return get_radio(key, info);
    } else if (info.field_type === fieldTypes.CHECKBOX) {
      return get_checkbox(key, info);
    } else if (info.field_type === fieldTypes.IMG) {
      return get_image(key, info);
    } else {
      return get_entry(key, info);
    }
  };

  const get_selection_entry = (key, info) => {
    return (
      <>
        <Form.Select
          defaultValue={
            isNewForm
              ? info.reference_field === "record_type_name"
                ? tableKey.split("_")[1]
                : null
              : info?.value
          }
          disabled={
            isNewForm
              ? info.reference_field === "record_type_name"
              : !info.is_editable || !isEdit
          }
          isInvalid={errors[key]}
          {...register(key, {
            validate: (value) =>
              !info.is_required ||
              value !== "NULL" ||
              getLabel("FORM_ERRORS.MANDATORY_FIELD_LABEL"),
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

  const get_radio = (key, info) => {
    return (
      <>
        {info.options.map((opt) => (
          <div key={opt.option_key} className="ms-2">
            <Form.Check
              inline
              type={info.field_type}
              required={info.is_required}
              disabled={isNewForm ? false : !info.is_editable || !isEdit}
              id={opt.option_key}
              label={opt.option_label}
              value={opt.option_key}
              isInvalid={errors[key]}
              {...register(key, {
                required: {
                  value: info.is_required,
                  message: getLabel("FORM_ERRORS.MANDATORY_FIELD_LABEL"),
                },
              })}
            />
            <Form.Control.Feedback type="invalid">
              {errors[key]?.message}
            </Form.Control.Feedback>
          </div>
        ))}
      </>
    );
  };

  const get_checkbox = (key, info) => {
    const disabled = isNewForm ? false : !info.is_editable || !isEdit;
    return (
      <>
        <span className="ms-2">
          <Form.Check
            inline
            type={info.field_type}
            required={info.is_required && !disabled}
            disabled={disabled}
            id={key}
            label={info.label}
            isInvalid={errors[key]}
            {...register(key, {
              required: {
                value: info.is_required && !disabled,
                message: getLabel("FORM_ERRORS.MANDATORY_FIELD_LABEL"),
              },
            })}
          />
          <Form.Control.Feedback type="invalid">
            {errors[key]?.message}
          </Form.Control.Feedback>
        </span>
      </>
    );
  };

  const get_image = (key, info) => {
    return (
      <Container key={key} fluid className="mb-3 p-0">
        <Row className="align-items-center">
          <Col xs={12} md={8}>
            <Image
              src={`${API_BASE_URL}/images/${info?.value}`}
              fluid
              rounded
            />
          </Col>
          <Col>
            <FloatingLabel
              controlId={`floating-${key}`}
              label={key.replaceAll("_", " ") + (info.is_required ? " *" : "")}
            >
              <Form.Control
                type={fieldTypes.TEXT}
                required={info.is_required}
                defaultValue={isNewForm ? null : info?.value}
                disabled={isNewForm ? false : !info.is_editable || !isEdit}
                isInvalid={errors[key]}
                {...register(key, {
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
                {errors[key]?.message}
              </Form.Control.Feedback>
            </FloatingLabel>
          </Col>
        </Row>
      </Container>
    );
  };

  const get_entry = (key, info) => {
    return (
      <>
        <Form.Control
          type={info.field_type}
          as={info?.is_textarea ? TextareaAutosize : undefined}
          required={info.is_required}
          defaultValue={isNewForm ? null : info?.value}
          disabled={isNewForm ? false : !info.is_editable || !isEdit}
          isInvalid={errors[key]}
          step={
            info.numeric_scale
              ? "0." + "1".padStart(info.numeric_scale, "0")
              : "1"
          }
          min={info?.min_limit_value && Number(info.min_limit_value)}
          max={info?.max_limit_value && Number(info.max_limit_value)}
          {...register(key, {
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
            min: {
              value: Number(info?.min_limit_value),
              message: getLabel("FORM_ERRORS.MIN_NUMBER_LABEL", {
                min_value: info?.min_limit_value,
              }),
            },
            max: {
              value: Number(info?.max_limit_value),
              message: getLabel("FORM_ERRORS.MAX_NUMBER_LABEL", {
                max_value: info?.max_limit_value,
              }),
            },
            pattern:
              info.field_type === "email"
                ? {
                    value: /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: getLabel("FORM_ERRORS.INVALID_EMAIL_LABEL"),
                  }
                : undefined,
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors[key]?.message}
        </Form.Control.Feedback>
        {info?.is_textarea ? (
          <div>{getLabel("GENERIC.TEXT_AREA_HELP_LABEL")}</div>
        ) : (
          <></>
        )}
      </>
    );
  };

  return (
    <Form
      id="recordDetailForm"
      noValidate
      validated={validated}
      onSubmit={onSubmit}
    >
      {Object.entries(fields).map(([key, info]) => {
        const isFloatingNotAllowed = [
          fieldTypes.RADIO,
          fieldTypes.CHECKBOX,
        ].includes(info.field_type);
        if (isFloatingNotAllowed) {
          return (
            <Form.Group
              key={key}
              className={
                info.field_type === fieldTypes.RADIO ? "mb-3" : "mb-3 d-flex"
              }
            >
              <Form.Label>
                {key.replaceAll("_", " ") + (info.is_required ? " *" : "")}
              </Form.Label>
              {renderField(key, info)}
            </Form.Group>
          );
        }

        const isImage = info.field_type === fieldTypes.IMG;
        if (isImage) {
          return renderField(key, info);
        }

        return (
          <FloatingLabel
            key={key}
            controlId={`floating-${key}`}
            label={key.replaceAll("_", " ") + (info.is_required ? " *" : "")}
            className="mb-3"
          >
            {renderField(key, info)}
          </FloatingLabel>
        );
      })}
    </Form>
  );
}
