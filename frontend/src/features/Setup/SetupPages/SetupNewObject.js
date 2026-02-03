import axios from "axios";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useForm } from "react-hook-form";

import {
  NEW_LABEL,
  ERROR_TOAST_BODY_LABEL,
  ERROR_TOAST_TITLE_LABEL,
  SETUP_MSG_SELECT_TABLE_LABEL,
} from "../../../config/IT";
import { API_BASE_URL } from "../../../config/K";
import { NEW_OBJECT_FIELD_STRUCTURE } from "../K_Setup";
import LoadingScreen from "../../../components/LoadingScreen";
import ToastMsg from "../../../components/ToastMsg";
import DynamicForm from "../../../components/dynamicUI/DynamicForm";
import DynamicRecordActions from "../../../components/dynamicUI/DynamicRecordActions";

export default function SetupNewObject() {
  const { refreshSidebar, setRefreshSidebar } = useOutletContext();

  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  const [toastConfig, setToastConfig] = useState({
    show: false,
    title: "",
    body: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm();

  //Method fired when the button Save is pressed
  const onSubmit = (data) => {
    setLoading(true);

    const apiData = {
      data: data,
    };
    axios
      .post(`${API_BASE_URL}/new-object`, apiData)
      .then((res) => {
        console.log("SetupNewObject - Insert object results:", res.data);
        if (res.data.result === 0) {
          setToastConfig({
            show: true,
            title: ERROR_TOAST_TITLE_LABEL,
            body: ERROR_TOAST_BODY_LABEL,
          });
        } else {
          setShowNewForm(false);
          setValidated(false);
          setRefreshSidebar(!refreshSidebar);
          reset();
        }
      })
      .catch((err) => {
        console.error("SetupNewObject - Error:", err);
        setToastConfig({
          show: true,
          title: ERROR_TOAST_TITLE_LABEL,
          body: err.response.data.detail,
        });
      })
      .finally(() => setLoading(false));

    setValidated(true);
  };

  //Create the API name of the object
  const object_label_value = watch("Object_label");
  useEffect(() => {
    if (!object_label_value) return;
    setValue("Object_name", object_label_value.replace(" ", "_").toLowerCase());
  }, [object_label_value, setValue]);

  if (loading) return <LoadingScreen />;

  return (
    <>
      <DynamicRecordActions
        setLoading={setLoading}
        editLabel={NEW_LABEL}
        isEdit={showNewForm}
        setIsEdit={setShowNewForm}
        reset={reset}
        setToastConfig={setToastConfig}
        hasDeleteButton={false}
        pathAPI={null}
        payloadAPI={null}
        redirectAPI={null}
        extraDescription={SETUP_MSG_SELECT_TABLE_LABEL}
      />
      {showNewForm ? (
        <>
          <DynamicForm
            fields={NEW_OBJECT_FIELD_STRUCTURE}
            validated={validated}
            onSubmit={handleSubmit(onSubmit)}
            tableKey={null}
            errors={errors}
            register={register}
            isNewForm={false}
            isEdit={true}
          />
          <ToastMsg
            showToast={toastConfig.show}
            setShowToast={(val) =>
              setToastConfig({ ...toastConfig, show: val })
            }
            color="danger"
            title={toastConfig.title}
            body={toastConfig.body}
          />
        </>
      ) : (
        ""
      )}
    </>
  );
}
