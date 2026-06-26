import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { useOutletContext } from "react-router-dom";

import { RecordListStructure } from "@/types/list.types";
import { DatabaseOutletContext } from "@/types/routing.types";
import { ENDPOINTS } from "@/api/endpoints";
import { ERROR_MISSING_TABLE } from "@/config/K";
import { ROUTES } from "@/config/routes";
import { useLabels } from "@/context/Label/Label";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useFeedback } from "@/hooks/useFeedback";
import DynamicRecordsList from "@/components/dynamicUI/DynamicRecordsList/DynamicRecordsList";
import LoadingScreen from "@/components/LoadingScreen/LoadingScreen";
import MissingPage from "@/components/MissingPage/MissingPage";

import NewRecord from "./NewRecord";

const getDisplayTitle = (key: string) => {
  if (!key) return "";

  const splittedKey = key.split("-");
  const recordTypeName = splittedKey[1] || "master";
  const tableName = splittedKey[0];

  let title =
    recordTypeName.toLowerCase() !== "master" ? recordTypeName : tableName;

  title = title.replaceAll("_", " ");
  return title.charAt(0)?.toUpperCase() + title.slice(1);
};

export default function RecordsListView(): React.ReactElement | null {
  const { tableKey } = useOutletContext<DatabaseOutletContext>();
  const { getLabel } = useLabels();
  const { showErrorToast } = useFeedback();
  const {
    data: records,
    loading,
    error,
    refetch,
  } = useApiQuery<RecordListStructure>(ENDPOINTS.records.recordsList(tableKey));

  const [showNewModal, setShowNewModal] = useState(false);
  const isMissingTable = error?.errorCode === ERROR_MISSING_TABLE;

  useEffect(() => {
    if (error && !isMissingTable) showErrorToast(error, "RECORD_LIST");
  }, [error, isMissingTable, showErrorToast]);

  if (loading) return <LoadingScreen />;

  if (isMissingTable) {
    return <MissingPage missingText={getLabel("MISSING.TABLE")} />;
  }

  if (!records) return null;

  return (
    <div>
      <div className="fs-3 fw-bold">{getDisplayTitle(tableKey)}</div>
      <div className="d-flex flex-row-reverse pb-2 pt-2">
        <Button
          size="sm"
          onClick={() => {
            setShowNewModal(true);
          }}
        >
          {getLabel("BUTTONS.NEW")}
        </Button>
      </div>
      <DynamicRecordsList
        data={records}
        getRecordPath={(id) => ROUTES.database.record(tableKey, id)}
      />
      <NewRecord
        tableKey={tableKey}
        showNewModal={showNewModal}
        setShowNewModal={setShowNewModal}
        refreshData={refetch}
      />
    </div>
  );
}
