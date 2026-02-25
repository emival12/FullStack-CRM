import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Tab, Tabs } from "react-bootstrap";
import type { ToastConfig, DatabaseOutletContext } from "commot.types";

import {
  API_BASE_URL,
  ERROR_MISSING_RECORD,
  PATH_DATABASE,
  PATH_DELETE,
  PATH_UPDATE,
} from "config/K";
import { useAuth } from "context/Auth/Auth";
import { useLabels } from "context/Label/Label";
import MissingPage from "components/MissingPage/MissingPage";
import LoadingScreen from "components/LoadingScreen/LoadingScreen";
import ToastMsg from "components/ToastMsg/ToastMsg";
import DynamicRecordActions from "components/dynamicUI/DynamicRecordActions/DynamicRecordActions";
import DynamicRecordsList from "components/dynamicUI/DynamicRecordsList/DynamicRecordsList";
import DynamicForm from "components/dynamicUI/DynamicForm/DynamicForm";
import type { DataRecordStructure } from "components/dynamicUI/DynamicForm/DynamicForm.types";

export default function RecordDetail() {
  const { tableKey, recordId } = useOutletContext<DatabaseOutletContext>();
  const { user } = useAuth();
  const { getLabel } = useLabels();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isEdit, setIsEdit] = useState(false);
  const [validated, setValidated] = useState(false);
  const [controlledError, setControlledError] = useState(false);
  const [toastConfig, setToastConfig] = useState<ToastConfig>({
    show: false,
    title: "",
    body: "",
  });

  const [fields, setFields] = useState<DataRecordStructure>({
    primary_key_name: "",
    field_structure: {},
    related_list: [],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const fetchData = useCallback(() => {
    if (!tableKey || !recordId) return; // Blocks execution if the selected tabel is not correct

    setLoading(true);
    setIsEdit(false);
    axios
      .get<DataRecordStructure>(
        `${API_BASE_URL}/${tableKey}/record/${recordId}`,
      )
      .then((res) => {
        console.log("RecordDetail - List of Fields Received:", res.data);
        setFields(res.data);

        //use to handle the values and redraw it
        const formValues = Object.fromEntries(
          Object.entries(res.data.field_structure).map(([key, info]) => [
            key,
            info.value,
          ]),
        );
        reset(formValues);
      })
      .catch((err) => {
        console.error("RecordDetail - Error:", err);
        const errMsg = err.response.data.detail;
        if (errMsg === ERROR_MISSING_RECORD) {
          setControlledError(true);
        }
      })
      .finally(() => setLoading(false));
  }, [tableKey, recordId, reset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  //Method fired when the button Save is pressed
  const onSubmit = (data: Record<string, any>) => {
    let modified_data: any = {};
    let new_PK = null;
    for (const key in fields.field_structure) {
      if (fields?.field_structure[key]?.value !== data[key]) {
        modified_data[key] = data[key];
        new_PK =
          key.toLowerCase() === fields.primary_key_name.toLowerCase()
            ? data[key]
            : null;
      }
    }

    if (Object.keys(modified_data).length > 0) {
      setLoading(true);
      const apiData = {
        table: tableKey,
        id: recordId,
        user: user,
        field: modified_data,
      };

      axios
        .post(`${API_BASE_URL}${PATH_UPDATE}`, apiData)
        .then((res) => {
          console.log(
            "RecordDetail - Sumbit - Uploaded record results:",
            res.data,
          );
          if (res.data.result === 0) {
            setToastConfig({
              show: true,
              title: getLabel("TOAST.ERROR_TOAST_TITLE_LABEL"),
              body: getLabel("TOAST.ERROR_TOAST_BODY_LABEL"),
            });
          } else {
            if (new_PK) {
              navigate(PATH_DATABASE + "/" + tableKey + "/" + new_PK);
            } else {
              fetchData();
              setIsEdit(false);
            }
            setValidated(false);
          }
        })
        .catch((err) => {
          console.error("RecordDetail - Error:", err);
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

  if (controlledError) {
    return (
      <MissingPage missingText={getLabel("MISSING.MISSING_RECORD_LABEL")} />
    );
  }

  return (
    <div>
      <Tabs
        defaultActiveKey="details"
        id="uncontrolled-tab-example"
        className="mb-3"
      >
        <Tab
          eventKey="details"
          title={getLabel("DETAIL_TABS.DETAIL_TAB_LABEL")}
        >
          <DynamicRecordActions
            setLoading={setLoading}
            editLabel={getLabel("BUTTONS.EDIT_LABEL")}
            isEdit={isEdit}
            setIsEdit={setIsEdit}
            reset={reset}
            setToastConfig={setToastConfig}
            hasDeleteButton={true}
            pathAPI={API_BASE_URL + PATH_DELETE}
            payloadAPI={{
              table: tableKey,
              id: recordId,
            }}
            redirectAPI={PATH_DATABASE + "/" + tableKey}
          />
          <DynamicForm
            fields={fields.field_structure}
            validated={validated}
            onSubmit={handleSubmit(onSubmit)}
            tableKey={tableKey}
            errors={errors}
            register={register}
            isNewForm={false}
            isEdit={isEdit}
          />
          <ToastMsg
            showToast={toastConfig.show}
            setShowToast={(val) =>
              setToastConfig({ ...toastConfig, show: val })
            }
            title={toastConfig.title}
            body={toastConfig.body}
          />
        </Tab>
        {fields.related_list.length > 0 ? (
          <Tab
            eventKey="relatedLists"
            title={getLabel("DETAIL_TABS.RELATED_TAB_LABEL")}
          >
            {Object.entries(fields.related_list).map(([key, related_list]) => {
              if (related_list?.records.length > 0) {
                return (
                  <div
                    className="border border-2 p-3 pt-2 rounded-4 mb-3"
                    key={key}
                  >
                    <div className="fw-bold mb-2">{related_list.label}</div>
                    <DynamicRecordsList
                      data={related_list}
                      redirectKey={related_list?.table?.key}
                    />
                  </div>
                );
              } else {
                return <></>;
              }
            })}
          </Tab>
        ) : null}
      </Tabs>
    </div>
  );
}
