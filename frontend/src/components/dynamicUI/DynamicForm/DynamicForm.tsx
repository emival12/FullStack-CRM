import { FloatingLabel, Form } from "react-bootstrap";
import TextareaAutosize from "react-textarea-autosize";

import {
  FieldOptionLookup,
  FieldOptionRadio,
  FieldType,
} from "@/types/field.types";
import { useLabels } from "@/context/Label/Label";
import { isBlank } from "@/utils/string";

import {
  type DynamicFormProps,
  type FieldRenderFunction,
} from "./DynamicForm.types";
import DynamicImage from "./DynamicImage";
import { isDisabled } from "./helpers";

const isLookupOptionArray = (
  arr: (FieldOptionRadio | FieldOptionLookup)[],
): arr is FieldOptionLookup[] => arr.length > 0 && "id" in arr[0];

const isRadioOptionArray = (
  arr: (FieldOptionRadio | FieldOptionLookup)[],
): arr is FieldOptionRadio[] => arr.length > 0 && "option_key" in arr[0];

/**
 * Shows a form with some fields
 */
export default function DynamicForm({
  fields,
  onSubmit,
  tableKey = undefined,
  errors,
  register,
  editability,
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
    const options = info.options;
    return (
      <>
        <Form.Select
          defaultValue={
            editability === "all"
              ? info.reference_field === "record_type_name"
                ? tableKey?.split("-")[1]
                : undefined
              : (info?.value ?? undefined)
          }
          disabled={
            editability === "all"
              ? info.reference_field === "record_type_name"
              : isDisabled(editability, info)
          }
          isInvalid={!!errors[key]} // !! means if the object exist writes true otherwise false
          {...register(key, {
            validate: (value: unknown): boolean | string => {
              if (!info.is_required) return true;
              if (value !== "NULL") return true;
              return getLabel("FORM.ERRORS.MANDATORY_FIELD");
            },
          })}
        >
          <option value="NULL"></option>
          {options &&
            isLookupOptionArray(options) &&
            options.map((opt) => (
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
    const options = info.options;
    return (
      <>
        {options &&
          isRadioOptionArray(options) &&
          options.map((opt) => (
            <div key={opt.option_key} className="ms-2">
              <Form.Check
                inline
                type="radio"
                required={Boolean(info.is_required)}
                disabled={isDisabled(editability, info)}
                id={opt.option_key}
                label={opt.option_label}
                value={opt.option_key}
                isInvalid={!!errors[key]} // !! means if the object exist writes true otherwise false
                {...register(key, {
                  required: {
                    value: Boolean(info.is_required),
                    message: getLabel("FORM.ERRORS.MANDATORY_FIELD"),
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
    const disabled = isDisabled(editability, info);
    const required = Boolean(info.is_required) && !disabled;
    return (
      <>
        <span className="ms-2">
          <Form.Check
            inline
            type="checkbox"
            required={required}
            disabled={disabled}
            id={key}
            label={info.label}
            isInvalid={!!errors[key]}
            {...register(key, {
              required: {
                value: required,
                message: getLabel("FORM.ERRORS.MANDATORY_FIELD"),
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
          as={
            info?.is_textarea
              ? (TextareaAutosize as React.ElementType)
              : undefined
          }
          required={Boolean(info.is_required)}
          defaultValue={info?.value}
          disabled={isDisabled(editability, info)}
          isInvalid={!!errors[key]}
          step={
            info.numeric_scale
              ? "0." + "1".padStart(info.numeric_scale, "0")
              : "1"
          }
          min={
            isBlank(info?.min_limit_value)
              ? undefined
              : Number(info.min_limit_value)
          }
          max={
            isBlank(info?.max_limit_value)
              ? undefined
              : Number(info.max_limit_value)
          }
          {...register(key, {
            required: {
              value: Boolean(info.is_required),
              message: getLabel("FORM.ERRORS.MANDATORY_FIELD"),
            },
            maxLength: info.length
              ? {
                  value: Number(info.length),
                  message: getLabel("FORM.ERRORS.MAX_LENGTH", {
                    max_length: String(info.length ?? ""),
                  }),
                }
              : undefined,
            min: isBlank(info?.min_limit_value)
              ? undefined
              : {
                  value: Number(info?.min_limit_value),
                  message: getLabel("FORM.ERRORS.MIN_NUMBER", {
                    min_value: String(info?.min_limit_value ?? ""),
                  }),
                },
            max: isBlank(info?.max_limit_value)
              ? undefined
              : {
                  value: Number(info?.max_limit_value),
                  message: getLabel("FORM.ERRORS.MAX_NUMBER", {
                    max_value: String(info?.max_limit_value ?? ""),
                  }),
                },
            pattern:
              info.field_type === "email"
                ? {
                    value: /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: getLabel("FORM.ERRORS.INVALID_EMAIL"),
                  }
                : undefined,
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors[key]?.message?.toString()}
        </Form.Control.Feedback>
        {Boolean(info?.is_textarea) && (
          <div>{getLabel("FORM.TEXT_AREA_HELP")}</div>
        )}
      </>
    );
  };

  return (
    <Form id="recordDetailForm" noValidate onSubmit={onSubmit}>
      {Object.entries(fields).map(([key, info]) => {
        const isFloatingNotAllowed =
          info.field_type === FieldType.RADIO ||
          info.field_type === FieldType.CHECKBOX;
        if (isFloatingNotAllowed) {
          const disabled = isDisabled(editability, info);
          return (
            <Form.Group
              key={key}
              className={
                info.field_type === FieldType.RADIO ? "mb-3" : "mb-3 d-flex"
              }
            >
              <Form.Label className={disabled ? "text-secondary" : undefined}>
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
              errors={errors}
              register={register}
              editability={editability}
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
