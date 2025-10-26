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
  const [refreshList, setRefreshList] = useState(false);

  useEffect(() => {
    if (!selectedTableKey && !tableKey) return; // Blocks execution if the selected tabel is not correct

    const actualTableKey = selectedTableKey || tableKey;
    setLoading(true);
    axios
      .get(API_BASE_URL + "/" + actualTableKey)
      .then((res) => {
        console.log("Record List Received:", res.data);
        setRecords(res.data);
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, [selectedTableKey, tableKey, refreshList]);

  if (!selectedTableKey && !tableKey) {
    return <MissingPage MissingText={MISSING_TABLE_LABEL} />;
  }

  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div className="fs-3 fw-bold">
        {selectedTableKey
          ? selectedTableKey.split("_")[0].charAt(0).toUpperCase() +
            selectedTableKey.split("_")[0].slice(1)
          : tableKey.split("_")[0].charAt(0).toUpperCase() +
            tableKey.split("_")[0].slice(1)}
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
        records={records}
        selectedTableKey={selectedTableKey || tableKey}
        onSelectedTable={setSelectedTableKey}
        onSelectedRecord={setSelectedRecord}
      />
      <NewRecord
        selectedTableKey={selectedTableKey || tableKey}
        showNewModal={showNewModal}
        setShowNewModal={setShowNewModal}
        setRefreshList={setRefreshList}
      />
    </div>
  );
}
