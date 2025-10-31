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
 * @param {Object[]} props.validated            - Flag to show or hide the validations
 * @param {Object[]} props.onSubmit             - Function to use on submit
 * @param {Object[]} props.selectedTableKey     - Key of the selected table
 * @param {Object[]} props.errors               - Collection of errors messages (standard of react-hook-form)
 * @param {Object[]} props.register             - Function to register the form element (standard of react-hook-form)
 * @param {Object[]} props.isNewForm            - Flag to understand which form is
 * @param {Object[]} props.isEdit               - Flag to understand if is in view or edit mode
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
      {Object.entries(fields).map(([key, info]) => (
        <FloatingLabel
          key={key}
          controlId="floatingInput"
          label={key.replace("_", " ") + (info.is_required ? " *" : "")}
          className="mb-3"
        >
          {info.field_type === "picklist" || info.field_type === "lookup"
            ? get_selection_entry(key, info)
            : get_entry(key, info)}
        </FloatingLabel>
      ))}
    </Form>
  );
}
