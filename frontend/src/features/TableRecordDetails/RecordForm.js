import { Form, FloatingLabel } from "react-bootstrap";
import {
  MANDATORY_FIELD_LABEL,
  MAX_FIELD_LABEL,
  MAX_NUMBER_LABEL,
} from "../../config/IT";

/**
 * Shows a form with some fields
 *
 * @param {Object[]} props.fields               - Fields to show
 * @param {Object} props.validated              - Flag to show or hide the validations
 * @param {Function} props.onSubmit             - Function to use on submit
 * @param {Object} props.selectedTableKey       - Key of the selected table
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
export default function RecordForm({
  fields,
  validated,
  onSubmit,
  selectedTableKey,
  errors,
  register,
  isNewForm,
  isEdit,
}) {
  const renderField = (key, info) => {
    if (info.field_type === "picklist" || info.field_type === "lookup") {
      return get_selection_entry(key, info);
    } else if (info.field_type === "radio") {
      return get_radio(key, info);
    } else if (info.field_type === "checkbox") {
      return get_checkbox(key, info);
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
              ? info.reference_field == "record_type_name"
                ? selectedTableKey.split("_")[1]
                : null
              : info?.value
          }
          disabled={
            isNewForm
              ? info.reference_field == "record_type_name"
              : !info.is_editable || !isEdit
          }
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
                  message: MANDATORY_FIELD_LABEL,
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
            value={info.value}
            isInvalid={errors[key]}
            {...register(key, {
              required: {
                value: info.is_required && !disabled,
                message: MANDATORY_FIELD_LABEL,
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

  const get_entry = (key, info) => {
    return (
      <>
        <Form.Control
          type={info.field_type}
          required={info.is_required}
          defaultValue={isNewForm ? null : info?.value}
          disabled={isNewForm ? false : !info.is_editable || !isEdit}
          isInvalid={errors[key]}
          step={
            info.numeric_scale
              ? "0." + "1".padStart(info.numeric_scale, "0")
              : "1"
          }
          min={info?.limit_value && -Number(info.limit_value)}
          max={info?.limit_value && Number(info.limit_value)}
          {...register(key, {
            required: {
              value: info.is_required,
              message: MANDATORY_FIELD_LABEL,
            },
            maxLength: {
              value: info.length,
              message: MAX_FIELD_LABEL.replace("X", info.length),
            },
            min: {
              value: -Number(info?.limit_value),
              message: MAX_NUMBER_LABEL.replace("X", -info?.limit_value),
            },
            max: {
              value: Number(info?.limit_value),
              message: MAX_NUMBER_LABEL.replace("X", info?.limit_value),
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
    <Form
      id="recordDetailForm"
      noValidate
      validated={validated}
      onSubmit={onSubmit}
    >
      {Object.entries(fields).map(([key, info]) => {
        const isFloatingAllowed = !["radio", "checkbox"].includes(
          info.field_type
        );
        return isFloatingAllowed ? (
          <FloatingLabel
            key={key}
            controlId={`floating-${key}`}
            label={key.replaceAll("_", " ") + (info.is_required ? " *" : "")}
            className="mb-3"
          >
            {renderField(key, info)}
          </FloatingLabel>
        ) : (
          <Form.Group
            key={key}
            className={info.field_type == "radio" ? "mb-3" : "mb-3 d-flex"}
          >
            <Form.Label>
              {key.replaceAll("_", " ") + (info.is_required ? " *" : "")}
            </Form.Label>
            {renderField(key, info)}
          </Form.Group>
        );
      })}
    </Form>
  );
}
