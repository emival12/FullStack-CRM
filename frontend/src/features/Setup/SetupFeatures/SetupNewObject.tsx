import axios from "axios";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useForm } from "react-hook-form";
import { SetupOutletContext, ToastConfig } from "commot.types";

import { API_BASE_URL, PATH_SETUP } from "config/K";
import { NEW_OBJECT_FIELD_STRUCTURE } from "features/Setup/K_SetupFormsStructure";
import { useLabels } from "context/Label/Label";
import LoadingScreen from "components/LoadingScreen/LoadingScreen";
import ToastMsg from "components/ToastMsg/ToastMsg";
import DynamicForm from "components/dynamicUI/DynamicForm/DynamicForm";
import DynamicRecordActions from "components/dynamicUI/DynamicRecordActions/DynamicRecordActions";
import { DataFieldStructure } from "components/dynamicUI/DynamicForm/DynamicForm.types";

export default function SetupNewObject(): React.ReactElement {
  const { getLabel } = useLabels();
  const { refreshSidebar, setRefreshSidebar } =
    useOutletContext<SetupOutletContext>();

  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  const [toastConfig, setToastConfig] = useState<ToastConfig>({
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
  const onSubmit = (data: Record<string, any>) => {
    setLoading(true);

    const apiData = {
      data: data,
    };
    axios
      .post(`${API_BASE_URL}${PATH_SETUP}/new-object`, apiData)
      .then((res) => {
        console.log("SetupNewObject - Insert object results:", res.data);
        if (res.data.result === 0) {
          setToastConfig({
            show: true,
            title: getLabel("TOAST.ERROR_TOAST_TITLE_LABEL"),
            body: getLabel("TOAST.ERROR_TOAST_BODY_LABEL"),
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
          title: getLabel("TOAST.ERROR_TOAST_TITLE_LABEL"),
          body:
            err?.response?.data?.detail ||
            getLabel("TOAST.ERROR_TOAST_BODY_LABEL"),
        });
      })
      .finally(() => setLoading(false));

    setValidated(true);
  };

  //Create the API name of the object
  const object_label_value = watch("object_label");
  useEffect(() => {
    if (!object_label_value) return;
    setValue(
      "object_name",
      object_label_value.replaceAll(" ", "_").toLowerCase(),
    );
  }, [object_label_value, setValue]);

  if (loading) return <LoadingScreen />;

  return (
    <>
      <DynamicRecordActions
        setLoading={setLoading}
        editLabel={getLabel("BUTTONS.NEW_LABEL")}
        isEdit={showNewForm}
        setIsEdit={setShowNewForm}
        reset={reset}
        setToastConfig={setToastConfig}
        hasDeleteButton={false}
        extraDescription={getLabel("GENERIC.SETUP_MSG_SELECT_TABLE_LABEL")}
      />
      {showNewForm ? (
        <>
          <DynamicForm
            fields={NEW_OBJECT_FIELD_STRUCTURE as DataFieldStructure}
            validated={validated}
            onSubmit={handleSubmit(onSubmit)}
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
