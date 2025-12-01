import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Modal } from "react-bootstrap";

import {
  SAVE_LABEL,
  ERROR_TOAST_BODY_LABEL,
  ERROR_TOAST_TITLE_LABEL,
  NEW_FIELD_TITLE_LABEL,
  NEXT_LABEL,
  PREVIOUS_LABEL,
} from "../../../config/IT";
import { API_BASE_URL, PATH_INSERT, PATH_SETUP } from "../../../config/K";
import {
  BASE_FIELD_OBJECT_STRUCTURE as BASE_FIELDS,
  NEW_TEXT_FIELD_OBJECT_STRUCTURE as NEW_TEXT_FIELDS,
  NEW_NUMBER_FIELD_OBJECT_STRUCTURE as NEW_NUMBER_FIELDS,
  NEW_LOOKUP_FIELD_OBJECT_STRUCTURE as NEW_LOOKUP_FIELDS,
  NEW_PICKLIST_FIELD_OBJECT_STRUCTURE as NEW_PICKLIST_FIELDS,
  NEW_ROLLUP_FIELD_OBJECT_STRUCTURE as NEW_ROLLUP_FIELDS,
  NEW_RADIO_FIELD_OBJECT_STRUCTURE as NEW_RADIO_FIELDS,
  NEW_CHECKBOX_FIELD_OBJECT_STRUCTURE as NEW_CHECKBOX_FIELDS,
} from "../K_Setup";
import RecordForm from "../../TableRecordDetails/RecordForm";
import ToastMsg from "../../../components/ToastMsg";

export default function FieldNewRecord({
  fieldTypeForm,
  selectedTableKey,
  showNewModal,
  setShowNewModal,
  refreshData,
}) {
  const [listFieldForms, setListFieldForms] = useState(false);
  const [mapObjectFields, setMapObjectFields] = useState();
  const [mapObjectRt, setMapObjectRt] = useState();
  const [fieldTypes, setFieldTypes] = useState();
  const [validated, setValidated] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastTitle, setToastTitle] = useState();
  const [toastBody, setToastBody] = useState();

  const [pageNumber, setPageNumber] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    resetField,
  } = useForm();

  const mergeDict = (dict1, dict2) => {
    const merged = {
      ...dict1,
      ...dict2,
    };

    return Object.fromEntries(
      Object.entries(merged).sort(([, a], [, b]) => a.order - b.order)
    );
  };

  const addOptionsToObject = (object, options, is_selection = true) => {
    const key = is_selection ? "id" : "option_label";
    const value = is_selection ? "reference_field" : "option_key";

    if (object.length == 0) {
      for (let o of Object.values(options)) {
        const key_value = o?.key ? o?.key : o;
        const label_value = o?.label ? o?.label : o;

        object.push({
          [key]: key_value,
          [value]: label_value,
        });
      }
    }
  };

  useEffect(() => {
    axios
      .get(API_BASE_URL + PATH_SETUP + "/field/new/structure")
      .then((res) => {
        console.log("Setup new Field structure Received:", res.data);
        setMapObjectFields(res.data.fields_options);
        setMapObjectRt(res.data.rt_options);
        setFieldTypes(res.data.field_types);

        const field_types = res.data.field_types;

        //Set the possible lookup object possibilities
        let obj_lookup_options = res.data.lookup_options;
        addOptionsToObject(
          NEW_LOOKUP_FIELDS.reference_object.options,
          obj_lookup_options
        );
        addOptionsToObject(
          NEW_PICKLIST_FIELDS.reference_object.options,
          obj_lookup_options
        );
        addOptionsToObject(
          NEW_ROLLUP_FIELDS.reference_object.options,
          obj_lookup_options
        );

        setListFieldForms({
          [field_types.TEXT]: mergeDict(BASE_FIELDS, NEW_TEXT_FIELDS),
          [field_types.NUMBER]: mergeDict(BASE_FIELDS, NEW_NUMBER_FIELDS),
          [field_types.LOOKUP]: mergeDict(BASE_FIELDS, NEW_LOOKUP_FIELDS),
          [field_types.PICKLIST]: mergeDict(BASE_FIELDS, NEW_PICKLIST_FIELDS),
          [field_types.ROLLUP]: mergeDict(BASE_FIELDS, NEW_ROLLUP_FIELDS),
          [field_types.RADIO]: mergeDict(BASE_FIELDS, NEW_RADIO_FIELDS),
          [field_types.CHECKBOX]: mergeDict(BASE_FIELDS, NEW_CHECKBOX_FIELDS),
        });

        //Set the possible field type possibilities
        addOptionsToObject(
          fieldTypeForm.field_type.options,
          field_types,
          false
        );
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => {});
  }, []);

  //Method fired when the button Save is pressed
  const onSubmit = (data) => {
    const formPointer = document.getElementById("recordDetailForm");
    if (formPointer.checkValidity()) {
      axios
        .post(
          API_BASE_URL + PATH_SETUP + "/" + selectedTableKey + "/field/new",
          {
            table: selectedTableKey,
            record: data,
          }
        )
        .then((res) => {
          console.log("Create new field results:", res.data);
          if (res.data.result == 0) {
            setShowToast(true);
            setToastTitle(ERROR_TOAST_TITLE_LABEL);
            setToastBody(ERROR_TOAST_BODY_LABEL);
          } else {
            setShowNewModal(false);
            refreshData();
          }
        })
        .catch((err) => {
          console.error("Error:", err);

          setShowToast(true);
          setToastTitle(ERROR_TOAST_TITLE_LABEL);
          setToastBody(err.response.data.detail);
        });
    }

    setValidated(true);
  };

  //Set the correct form after the field_type change
  const field_type_value = watch("field_type");
  useEffect(() => {
    if (!field_type_value || !(field_type_value in listFieldForms)) return;

    const formStructure = listFieldForms[field_type_value];
    const formValues = Object.fromEntries(
      Object.entries(formStructure).map(([key, info]) => [key, info.value])
    );

    const mergedValues = { field_type: field_type_value, ...formValues };
    reset(mergedValues);
  }, [field_type_value]);

  //Set the picklist for the reference field fter the reference_object change
  const reference_object_value = watch("reference_object");
  useEffect(() => {
    if (!reference_object_value || !(reference_object_value in mapObjectFields))
      return;

    let new_options = [];
    addOptionsToObject(new_options, mapObjectFields[reference_object_value]);
    getCorrectForm().reference_field.options = new_options;
    resetField("reference_field");

    if (field_type_value === fieldTypes.ROLLUP) {
      let new_rt_options = [];
      addOptionsToObject(new_rt_options, mapObjectRt[reference_object_value]);
      getCorrectForm().reference_object_record_type.options = new_rt_options;
      resetField("reference_object_record_type");
    }
  }, [reference_object_value]);

  const getCorrectForm = () => {
    return listFieldForms[field_type_value];
  };

  return (
    <>
      <Modal
        show={showNewModal}
        onHide={() => {
          reset();
          setShowNewModal(false);
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>{NEW_FIELD_TITLE_LABEL}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <RecordForm
            fields={pageNumber === 1 ? fieldTypeForm : getCorrectForm()}
            validated={validated}
            onSubmit={handleSubmit(onSubmit)}
            selectedTableKey={selectedTableKey}
            errors={errors}
            register={register}
            isNewForm={false}
            isEdit={true}
          ></RecordForm>
        </Modal.Body>

        <Modal.Footer>
          <Button
            hidden={pageNumber === 1}
            variant="primary"
            onClick={() => setPageNumber(1)}
          >
            {PREVIOUS_LABEL}
          </Button>
          <Button
            hidden={pageNumber === 1}
            variant="primary"
            onClick={() =>
              document.getElementById("recordDetailForm").requestSubmit()
            }
          >
            {SAVE_LABEL}
          </Button>
          <Button
            hidden={pageNumber !== 1}
            disabled={!field_type_value}
            variant="primary"
            onClick={() => setPageNumber(2)}
          >
            {NEXT_LABEL}
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastMsg
        showToast={showToast}
        setShowToast={setShowToast}
        color="danger"
        title={toastTitle}
        body={toastBody}
      ></ToastMsg>
    </>
  );
}
