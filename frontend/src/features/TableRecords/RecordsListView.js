import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { Button } from "react-bootstrap";

import { API_BASE_URL, ERROR_MISSING_TABLE } from "../../config/K";
import { useLabels } from "../../config/Label";
import MissingPage from "../../components/MissingPage";
import LoadingScreen from "../../components/LoadingScreen";
import DynamicRecordsList from "../../components/dynamicUI/DynamicRecordsList";
import NewRecord from "./NewRecord";

const getDisplayTitle = (key) => {
  if (!key) return "";

  const splittedKey = key.split("_");
  const recordTypeName = splittedKey.pop();
  const tableName = splittedKey.join(" ");

  const title =
    recordTypeName.toLowerCase() !== "master" ? recordTypeName : tableName;

  return title.charAt(0).toUpperCase() + title.slice(1);
};

export default function RecordsListView() {
  const { getLabel } = useLabels();
  const { tableKey } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [controlledError, setControlledError] = useState(false);

  const fetchData = useCallback(() => {
    if (!tableKey) return; // Blocks execution if the selected table is missing

    setLoading(true);
    setControlledError(false);
    axios
      .get(`${API_BASE_URL}/${tableKey}`)
      .then((res) => {
        console.log("RecordsListView - List of Records Received:", res.data);
        setRecords(res.data);
      })
      .catch((err) => {
        console.error("RecordsListView - Error:", err);
        const errorCode = err.response.data.detail.error_code;
        if (errorCode === ERROR_MISSING_TABLE) {
          setControlledError(true);
        }
      })
      .finally(() => setLoading(false));
  }, [tableKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingScreen />;

  if (controlledError) {
    return (
      <MissingPage missingText={getLabel("MISSING.MISSING_TABLE_LABEL")} />
    );
  }

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
          {getLabel("BUTTONS.NEW_LABEL")}
        </Button>
      </div>
      <DynamicRecordsList data={records} redirectKey={tableKey} />
      <NewRecord
        tableKey={tableKey}
        showNewModal={showNewModal}
        setShowNewModal={setShowNewModal}
        refreshData={fetchData}
      />
    </div>
  );
}
