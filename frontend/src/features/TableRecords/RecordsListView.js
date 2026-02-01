import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { Button } from "react-bootstrap";

import { MISSING_TABLE_LABEL, NEW_LABEL } from "../../config/IT";
import { API_BASE_URL, ERROR_MISSING_TABLE } from "../../config/K";
import MissingPage from "../../components/MissingPage";
import LoadingScreen from "../../components/LoadingScreen";
import RecordsList from "./RecordsList";
import NewRecord from "./NewRecord";

const getDisplayTitle = (key) => {
  if (!key) return "";

  const splittedKey = key.split("_");
  const tableName = splittedKey[0];
  const recordTypeName = splittedKey[1];

  const title =
    recordTypeName.toLowerCase() !== "master" ? recordTypeName : tableName;

  return title.charAt(0).toUpperCase() + title.slice(1);
};

export default function RecordsListView() {
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
        const errMsg = err.response.data.detail;
        if (errMsg === ERROR_MISSING_TABLE(tableKey)) {
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
    return <MissingPage missingText={MISSING_TABLE_LABEL} />;
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
          {NEW_LABEL}
        </Button>
      </div>
      <RecordsList recordsList={records} tableKey={tableKey} />
      <NewRecord
        tableKey={tableKey}
        showNewModal={showNewModal}
        setShowNewModal={setShowNewModal}
        refreshData={fetchData}
      />
    </div>
  );
}
