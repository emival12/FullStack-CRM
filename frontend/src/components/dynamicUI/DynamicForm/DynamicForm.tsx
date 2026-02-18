import { Form, FloatingLabel } from "react-bootstrap";
import TextareaAutosize from "react-textarea-autosize";
import { FieldType } from "commot.types";
import {
  type DynamicFormProps,
  type FieldRenderFunction,
} from "./DynamicForm.types";

import { useLabels } from "context/Label/Label";
import DynamicImage from "./DynamicImage";

/**
 * Shows a form with some fields
 */
export default function DynamicForm({
  fields,
  validated,
  onSubmit,
  tableKey = undefined,
  errors,
  register,
  isNewForm,
  isEdit = undefined,
}: DynamicFormProps): React.ReactElement {
  const { getLabel } = useLabels();

  const renderField: FieldRenderFunction = (key, info) => {
    if (
      info.field_type === FieldType.PICKLIST ||
      info.field_type === FieldType.LOOKUP
    ) {
      return get_selection_entry(key, info);
    } else if (info.field_type === FieldType.RADIO) {
      return get_radio(key, info);
    } else if (info.field_type === FieldType.CHECKBOX) {
      return get_checkbox(key, info);
    } else {
      return get_entry(key, info);
    }
  };

  const get_selection_entry: FieldRenderFunction = (key, info) => {
    return (
      <>
        <Form.Select
          defaultValue={
            isNewForm
              ? info.reference_field === "record_type_name"
                ? tableKey?.split("_")[1]
                : null
              : info?.value
          }
          disabled={
            isNewForm
              ? info.reference_field === "record_type_name"
              : !info.is_editable || !isEdit
          }
          isInvalid={!!errors[key]} // !! means if the object exist writes true otherwise false
          {...register(key, {
            validate: (value: any): boolean | string => {
              if (!info.is_required) return true;
              if (value !== "NULL") return true;
              return getLabel("FORM_ERRORS.MANDATORY_FIELD_LABEL") as string;
            },
          })}
        >
          <option value="NULL"></option>
          {info.options?.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.reference_field}
            </option>
          ))}
        </Form.Select>
        <Form.Control.Feedback type="invalid">
          {errors[key]?.message?.toString()}
        </Form.Control.Feedback>
      </>
    );
  };

  const get_radio: FieldRenderFunction = (key, info) => {
    return (
      <>
        {info.options?.map((opt) => (
          <div key={opt.option_key} className="ms-2">
            <Form.Check
              inline
              type={info.field_type as any}
              required={!!info.is_required}
              disabled={isNewForm ? false : !info.is_editable || !isEdit}
              id={opt.option_key}
              label={opt.option_label}
              value={opt.option_key}
              isInvalid={!!errors[key]} // !! means if the object exist writes true otherwise false
              {...register(key, {
                required: {
                  value: !!info.is_required,
                  message: getLabel(
                    "FORM_ERRORS.MANDATORY_FIELD_LABEL",
                  ) as string,
                },
              })}
            />
            <Form.Control.Feedback type="invalid">
              {errors[key]?.message?.toString()}
            </Form.Control.Feedback>
          </div>
        ))}
      </>
    );
  };

  const get_checkbox: FieldRenderFunction = (key, info) => {
    const disabled = isNewForm ? false : !info.is_editable || !isEdit;
    const required = info.is_required && !disabled;
    return (
      <>
        <span className="ms-2">
          <Form.Check
            inline
            type={info.field_type as any}
            required={!!required}
            disabled={disabled}
            id={key}
            label={info.label}
            isInvalid={!!errors[key]}
            {...register(key, {
              required: {
                value: !!required,
                message: getLabel(
                  "FORM_ERRORS.MANDATORY_FIELD_LABEL",
                ) as string,
              },
            })}
          />
          <Form.Control.Feedback type="invalid">
            {errors[key]?.message?.toString()}
          </Form.Control.Feedback>
        </span>
      </>
    );
  };

  const get_entry: FieldRenderFunction = (key, info) => {
    return (
      <>
        <Form.Control
          type={info.field_type}
          as={info?.is_textarea ? (TextareaAutosize as any) : undefined}
          required={!!info.is_required}
          defaultValue={isNewForm ? null : info?.value}
          disabled={isNewForm ? false : !info.is_editable || !isEdit}
          isInvalid={!!errors[key]}
          step={
            info.numeric_scale
              ? "0." + "1".padStart(info.numeric_scale, "0")
              : "1"
          }
          min={info?.min_limit_value && Number(info.min_limit_value)}
          max={info?.max_limit_value && Number(info.max_limit_value)}
          {...register(key, {
            required: {
              value: !!info.is_required,
              message: getLabel("FORM_ERRORS.MANDATORY_FIELD_LABEL") as string,
            },
            maxLength: info.length
              ? {
                  value: Number(info.length),
                  message: getLabel("FORM_ERRORS.MAX_FIELD_LABEL", {
                    max_length: String(info.length ?? ""),
                  }) as string,
                }
              : undefined,
            min: {
              value: Number(info?.min_limit_value),
              message: getLabel("FORM_ERRORS.MIN_NUMBER_LABEL", {
                min_value: String(info?.min_limit_value ?? ""),
              }) as string,
            },
            max: {
              value: Number(info?.max_limit_value),
              message: getLabel("FORM_ERRORS.MAX_NUMBER_LABEL", {
                max_value: String(info?.max_limit_value ?? ""),
              }) as string,
            },
            pattern:
              (info.field_type as string) === "email"
                ? {
                    value: /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: getLabel(
                      "FORM_ERRORS.INVALID_EMAIL_LABEL",
                    ) as string,
                  }
                : undefined,
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors[key]?.message?.toString()}
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
          FieldType.RADIO,
          FieldType.CHECKBOX,
        ].includes(info.field_type);
        if (isFloatingNotAllowed) {
          return (
            <Form.Group
              key={key}
              className={
                info.field_type === FieldType.RADIO ? "mb-3" : "mb-3 d-flex"
              }
            >
              <Form.Label>
                {key.replaceAll("_", " ") + (info.is_required ? " *" : "")}
              </Form.Label>
              {renderField(key, info)}
            </Form.Group>
          );
        }

        const isImage = info.field_type === FieldType.IMG;
        if (isImage) {
          return (
            <DynamicImage
              key={key}
              fieldKey={key}
              info={info}
              isNewForm={isNewForm}
              isEdit={!!isEdit}
              errors={errors}
              register={register}
            />
          );
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
