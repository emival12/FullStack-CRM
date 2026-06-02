import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Tab, Tabs } from "react-bootstrap";

import { DataRecordStructure } from "./RecordDetail.types";
import { DatabaseOutletContext } from "types/routing.types";
import { ApiError, CRUDResult } from "api/types";
import {
  ERROR_MISSING_RECORD,
  ERROR_MISSING_TABLE,
  PATH_DATABASE,
} from "config/K";
import { ENDPOINTS } from "api/endpoints";
import { useLabels } from "context/Label/Label";
import { useFeedback } from "hooks/useFeedback";
import { useAuth } from "context/Auth/Auth";
import { useApiQuery } from "hooks/useApiQuery";
import { useApiMutation } from "hooks/useApiMutation";
import MissingPage from "components/MissingPage/MissingPage";
import LoadingScreen from "components/LoadingScreen/LoadingScreen";
import DynamicRecordActions from "components/dynamicUI/DynamicRecordActions/DynamicRecordActions";
import DynamicRecordsList from "components/dynamicUI/DynamicRecordsList/DynamicRecordsList";
import DynamicForm from "components/dynamicUI/DynamicForm/DynamicForm";

const PREFIX = "RECORD_DETAIL";

export default function RecordDetail(): React.ReactElement | null {
  const { tableKey, recordId } = useOutletContext<DatabaseOutletContext>();
  const { getLabel } = useLabels();
  const { user } = useAuth();
  const { showErrorToast } = useFeedback();
  const {
    data: fields,
    loading: loadingForm,
    error: errorForm,
    refetch,
  } = useApiQuery<DataRecordStructure>(
    ENDPOINTS.records.recordDetail(tableKey, recordId!),
    { enabled: Boolean(tableKey && recordId) },
  );
  const { mutate, loading: loadingSubmit } = useApiMutation<
    Record<string, any>,
    CRUDResult
  >(ENDPOINTS.crud.update, "post");
  const navigate = useNavigate();

  const [isEdit, setIsEdit] = useState(false);
  const loading = loadingForm || loadingSubmit;
  const isMissingLabel =
    errorForm?.errorCode === ERROR_MISSING_RECORD
      ? "MISSING.RECORD"
      : errorForm?.errorCode === ERROR_MISSING_TABLE
        ? "MISSING.TABLE"
        : undefined;
  const formValues = fields
    ? Object.fromEntries(
        Object.entries(fields.field_structure).map(([key, info]) => [
          key,
          info.value,
        ]),
      )
    : undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ values: formValues });

  useEffect(() => {
    if (errorForm && !isMissingLabel) showErrorToast(errorForm, PREFIX);
  }, [errorForm, isMissingLabel, showErrorToast]);

  //Method fired when the button Save is pressed
  const onSubmit = async (data: Record<string, any>) => {
    if (!fields) return;

    let modified_data: Record<string, any> = {};
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
      const payload = {
        table: tableKey,
        id: recordId,
        user: user,
        field: modified_data,
      };

      try {
        await mutate(payload);
        setIsEdit(false);
        if (new_PK) {
          navigate(PATH_DATABASE + "/" + tableKey + "/" + new_PK);
        } else {
          refetch();
        }
      } catch (err) {
        showErrorToast(err as ApiError, PREFIX);
      }
    }
  };

  if (loading) return <LoadingScreen />;

  if (isMissingLabel) {
    return <MissingPage missingText={getLabel(isMissingLabel)} />;
  }

  if (!fields) return null;

  return (
    <div>
      <Tabs
        defaultActiveKey="details"
        id="uncontrolled-tab-example"
        className="mb-3"
      >
        <Tab eventKey="details" title={getLabel("TABS.RECORD_DETAIL.DETAIL")}>
          <DynamicRecordActions
            editLabel={getLabel("BUTTONS.EDIT")}
            isEdit={isEdit}
            setIsEdit={setIsEdit}
            reset={reset}
            errorPrefix={PREFIX}
            hasDeleteButton={true}
            pathAPI={ENDPOINTS.crud.delete}
            payloadAPI={{
              table: tableKey,
              id: recordId,
            }}
            redirectAPI={PATH_DATABASE + "/" + tableKey}
          />
          <DynamicForm
            fields={fields.field_structure}
            validated={false}
            onSubmit={handleSubmit(onSubmit)}
            tableKey={tableKey}
            errors={errors}
            register={register}
            isNewForm={false}
            isEdit={isEdit}
          />
        </Tab>
        {fields.related_list.length > 0 ? (
          <Tab
            eventKey="relatedLists"
            title={getLabel("TABS.RECORD_DETAIL.RELATED")}
          >
            {Object.entries(fields.related_list).map(([key, related_list]) => (
              <div
                className="border border-2 p-3 pt-2 rounded-4 mb-3"
                key={key}
              >
                <div className="fw-bold mb-2">{related_list.label}</div>
                <DynamicRecordsList
                  data={related_list}
                  redirectKey={related_list.table.key}
                />
              </div>
            ))}
          </Tab>
        ) : null}
      </Tabs>
    </div>
  );
}
