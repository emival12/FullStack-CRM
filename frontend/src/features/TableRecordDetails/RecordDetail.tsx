import { useEffect, useState } from "react";
import { Tab, Tabs } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useNavigate, useOutletContext } from "react-router-dom";

import { DatabaseOutletContext } from "@/types/routing.types";
import { ENDPOINTS } from "@/api/endpoints";
import { ApiError, CRUDResult } from "@/api/types";
import { ERROR_MISSING_RECORD, ERROR_MISSING_TABLE } from "@/config/K";
import { ROUTES } from "@/config/routes";
import { useAuth } from "@/context/Auth/Auth";
import { useLabels } from "@/context/Label/Label";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useFeedback } from "@/hooks/useFeedback";
import DynamicForm from "@/components/dynamicUI/DynamicForm/DynamicForm";
import DynamicRecordActions from "@/components/dynamicUI/DynamicRecordActions/DynamicRecordActions";
import DynamicRecordsList from "@/components/dynamicUI/DynamicRecordsList/DynamicRecordsList";
import LoadingScreen from "@/components/LoadingScreen/LoadingScreen";
import MissingPage from "@/components/MissingPage/MissingPage";

import { DataRecordStructure } from "./RecordDetail.types";

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

    const modified_data: Record<string, any> = {};
    let new_PK = null;
    for (const [key, info] of Object.entries(fields.field_structure)) {
      if (info?.value !== data[key]) {
        modified_data[key] = data[key];

        if (key.toLowerCase() === fields.primary_key_name.toLowerCase()) {
          new_PK = data[key];
        }
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
        if (new_PK !== null) {
          navigate(ROUTES.database.record(tableKey, new_PK));
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
            redirectAPI={ROUTES.database.table(tableKey)}
          />
          <DynamicForm
            fields={fields.field_structure}
            onSubmit={handleSubmit(onSubmit)}
            tableKey={tableKey}
            errors={errors}
            register={register}
            editability={isEdit ? "byField" : "none"}
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
                  getRecordPath={(id) =>
                    ROUTES.database.record(related_list.table.key, id)
                  }
                />
              </div>
            ))}
          </Tab>
        ) : null}
      </Tabs>
    </div>
  );
}
