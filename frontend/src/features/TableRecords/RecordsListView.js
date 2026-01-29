import axios from "axios";
import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Button } from "react-bootstrap";

import { MISSING_TABLE_LABEL, NEW_LABEL } from "../../config/IT";
import { API_BASE_URL } from "../../config/K";
import MissingPage from "../../components/MissingPage";
import LoadingScreen from "../../components/LoadingScreen";
import RecordsList from "./RecordsList";
import NewRecord from "./NewRecord";

export default function RecordsListView() {
  const { tableKey } = useParams();
  const {
    selectedTableKey,
    setSelectedTableKey,
    selectedRecord,
    setSelectedRecord,
  } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [showNewModal, setShowNewModal] = useState(false);

  const actualTableKey = selectedTableKey || tableKey;

  const fetchData = () => {
    if (!actualTableKey) return; // Blocks execution if the selected tabel is not correct

    setLoading(true);
    axios
      .get(API_BASE_URL + "/" + actualTableKey)
      .then((res) => {
        console.log("Record List Received:", res.data);
        setRecords(res.data);
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [selectedTableKey, tableKey]);

  if (!actualTableKey) {
    return <MissingPage MissingText={MISSING_TABLE_LABEL} />;
  }

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div className="fs-3 fw-bold">
        {actualTableKey.split("_")[0].charAt(0).toUpperCase() +
          actualTableKey.split("_")[0].slice(1)}
      </div>
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
      <RecordsList
        recordsList={records}
        selectedTableKey={actualTableKey}
        onSelectedTable={setSelectedTableKey}
        onSelectedRecord={setSelectedRecord}
      />
      <NewRecord
        selectedTableKey={actualTableKey}
        showNewModal={showNewModal}
        setShowNewModal={setShowNewModal}
        refreshData={fetchData}
      />
    </div>
  );
}
