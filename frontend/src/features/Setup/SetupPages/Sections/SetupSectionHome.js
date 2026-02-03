import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";

import {
  EDIT_LABEL,
  ERROR_TOAST_BODY_LABEL,
  ERROR_TOAST_TITLE_LABEL,
} from "../../../../config/IT";
import {
  API_BASE_URL,
  PATH_DELETE,
  PATH_SETUP,
  PATH_UPDATE,
} from "../../../../config/K";
import { HOME_OBJECT_FIELD_STRUCTURE } from "../../K_Setup";
import ToastMsg from "../../../../components/ToastMsg";
import LoadingScreen from "../../../../components/LoadingScreen";
import DynamicForm from "../../../../components/dynamicUI/DynamicForm";
import DynamicRecordActions from "../../../../components/dynamicUI/DynamicRecordActions";

/**
 * Page used for the section Home of an object in the setup
 *
 * @param {String} props.tableKey       - Table currently selected
 * @param {String} props.sectionKey     - Section currently selected
 */
export default function SetupSectionHome({ tableKey, sectionKey }) {
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [validated, setValidated] = useState(false);

  const [toastConfig, setToastConfig] = useState({
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
      .get(`${API_BASE_URL}${PATH_SETUP}/${tableKey}`)
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
  const onSubmit = (data) => {
    let modified_data = {};
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
              title: ERROR_TOAST_TITLE_LABEL,
              body: ERROR_TOAST_BODY_LABEL,
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
            title: ERROR_TOAST_TITLE_LABEL,
            body: err.response.data.detail,
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
        editLabel={EDIT_LABEL}
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
        extraDescription={null}
      />
      <DynamicForm
        fields={HOME_OBJECT_FIELD_STRUCTURE}
        validated={validated}
        onSubmit={handleSubmit(onSubmit)}
        tableKey={null}
        errors={errors}
        register={register}
        isNewForm={null}
        isEdit={isEdit}
      />
      <ToastMsg
        showToast={toastConfig.show}
        setShowToast={(val) => setToastConfig({ ...toastConfig, show: val })}
        color="danger"
        title={toastConfig.title}
        body={toastConfig.body}
      />
    </>
  );
}
