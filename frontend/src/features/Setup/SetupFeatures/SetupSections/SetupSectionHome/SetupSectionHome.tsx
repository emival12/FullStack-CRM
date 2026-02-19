import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useOutletContext } from "react-router-dom";
import {
  MetadataFieldStructure,
  SetupOutletContext,
  ToastConfig,
} from "commot.types";
import { SetupSectionBaseProps } from "../SetupSections.types";
import { DataFieldStructure } from "components/dynamicUI/DynamicForm/DynamicForm.types";

import { API_BASE_URL, PATH_DELETE, PATH_SETUP, PATH_UPDATE } from "config/K";
import { HOME_OBJECT_FIELD_STRUCTURE } from "features/Setup/K_SetupFormsStructure";
import { useLabels } from "context/Label/Label";
import ToastMsg from "components/ToastMsg/ToastMsg";
import LoadingScreen from "components/LoadingScreen/LoadingScreen";
import DynamicForm from "components/dynamicUI/DynamicForm/DynamicForm";
import DynamicRecordActions from "components/dynamicUI/DynamicRecordActions/DynamicRecordActions";

/**
 * Page used for the section Home of an object in the setup
 */
export default function SetupSectionHome({
  tableKey,
  sectionKey,
}: SetupSectionBaseProps): React.ReactElement {
  const { getLabel } = useLabels();
  const { refreshSidebar, setRefreshSidebar } =
    useOutletContext<SetupOutletContext>();

  const [loading, setLoading] = useState(true);
  const [isEdit, setIsEdit] = useState(false);
  const [validated, setValidated] = useState(false);
  const [fields, setFields] = useState<MetadataFieldStructure>({});

  const [toastConfig, setToastConfig] = useState<ToastConfig>({
    show: false,
    title: "",
    body: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const fetchData = useCallback(() => {
    if (!tableKey || !sectionKey) return; // Blocks execution if the selected tabel is not correct

    setLoading(true);
    setIsEdit(false);
    setValidated(false);
    axios
      .get<MetadataFieldStructure>(`${API_BASE_URL}${PATH_SETUP}/${tableKey}`)
      .then((res) => {
        console.log(
          "SetupSectionHome - List of Object Fields Received:",
          res.data,
        );
        setFields(res.data);

        //Insert the values retrieved into the form and redraw it
        const formValues = Object.fromEntries(
          Object.entries(HOME_OBJECT_FIELD_STRUCTURE).map(([key, info]) => [
            key,
            res.data[key.toLowerCase()],
          ]),
        );
        reset(formValues);
      })
      .catch((err) => console.error("SetupSectionHome - Error:", err))
      .finally(() => setLoading(false));
  }, [tableKey, sectionKey, reset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  //Method fired when the button Save is pressed
  const onSubmit = (data: Record<string, any>) => {
    let modified_data: Record<string, any> = {};
    for (const key in data) {
      if (fields[key.toLowerCase()] !== data[key]) {
        modified_data[key] = data[key];
      }
    }

    if (Object.keys(modified_data).length > 0) {
      setLoading(true);

      const apiData = {
        table: tableKey,
        field: modified_data,
      };

      axios
        .post(`${API_BASE_URL}${PATH_SETUP}/${tableKey}${PATH_UPDATE}`, apiData)
        .then((res) => {
          console.log("SetupSectionHome - Updated sections results:", res.data);
          if (res.data.result === 0) {
            setToastConfig({
              show: true,
              title: getLabel("TOAST.ERROR_TOAST_TITLE_LABEL"),
              body: getLabel("TOAST.ERROR_TOAST_BODY_LABEL"),
            });
          } else {
            fetchData();
            setIsEdit(false);
            setValidated(false);
          }
        })
        .catch((err) => {
          console.error("Error:", err);
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
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <>
      <DynamicRecordActions
        setLoading={setLoading}
        editLabel={getLabel("BUTTONS.EDIT_LABEL")}
        isEdit={isEdit}
        setIsEdit={setIsEdit}
        reset={reset}
        setToastConfig={setToastConfig}
        hasDeleteButton={true}
        pathAPI={`${API_BASE_URL}${PATH_SETUP}/${sectionKey}${PATH_DELETE}`}
        payloadAPI={{
          table: tableKey,
        }}
        redirectAPI={PATH_SETUP}
        extraActionOnDelete={() => {
          setRefreshSidebar(!refreshSidebar);
        }}
      />
      <DynamicForm
        fields={HOME_OBJECT_FIELD_STRUCTURE as DataFieldStructure}
        validated={validated}
        onSubmit={handleSubmit(onSubmit)}
        errors={errors}
        register={register}
        isEdit={isEdit}
      />
      <ToastMsg
        showToast={toastConfig.show}
        setShowToast={(val) => setToastConfig({ ...toastConfig, show: val })}
        title={toastConfig.title}
        body={toastConfig.body}
      />
    </>
  );
}
