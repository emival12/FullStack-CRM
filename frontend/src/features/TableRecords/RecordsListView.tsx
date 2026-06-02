import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Button } from "react-bootstrap";

import NewRecord from "./NewRecord";
import { DatabaseOutletContext } from "types/routing.types";
import { RecordListStructure } from "types/list.types";
import { ERROR_MISSING_TABLE } from "config/K";
import { ENDPOINTS } from "api/endpoints";
import { useLabels } from "context/Label/Label";
import { useFeedback } from "hooks/useFeedback";
import { useApiQuery } from "hooks/useApiQuery";
import MissingPage from "components/MissingPage/MissingPage";
import LoadingScreen from "components/LoadingScreen/LoadingScreen";
import DynamicRecordsList from "components/dynamicUI/DynamicRecordsList/DynamicRecordsList";

const getDisplayTitle = (key: string) => {
  if (!key) return "";

  const splittedKey = key.split("_");
  const recordTypeName = splittedKey.pop() || "master";
  const tableName = splittedKey.join(" ");

  const title =
    recordTypeName.toLowerCase() !== "master" ? recordTypeName : tableName;

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
      <DynamicRecordsList data={records} redirectKey={tableKey} />
      <NewRecord
        tableKey={tableKey}
        showNewModal={showNewModal}
        setShowNewModal={setShowNewModal}
        refreshData={refetch}
      />
    </div>
  );
}
