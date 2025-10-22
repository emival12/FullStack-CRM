import axios from "axios";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Button } from "react-bootstrap";

import { MISSING_TABLE_LABEL, NEW_LABEL } from "../../config/IT";
import { API_BASE_URL } from "../../config/K";
import MissingPage from "../../components/MissingPage";
import LoadingScreen from "../../components/LoadingScreen";
import RecordsList from "./RecordsList";
import NewRecord from "./NewRecord";

export default function RecordsListView() {
  const { selectedTable, selectedRecord, setSelectedRecord } =
    useOutletContext();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [refreshList, setRefreshList] = useState(false);

  useEffect(() => {
    if (!selectedTable) return; // Blocks execution if the selected tabel is not correct

    setLoading(true);
    axios
      .get(API_BASE_URL + "/" + selectedTable?.key)
      .then((res) => {
        console.log("Record List Received:", res.data);
        setRecords(res.data);
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, [selectedTable, refreshList]);

  if (!selectedTable) return <MissingPage MissingText={MISSING_TABLE_LABEL} />;
  if (loading) return <LoadingScreen />;

  return (
    <div>
      <div className="fs-3 fw-bold">{selectedTable.label}</div>
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
        selectedTable={selectedTable}
        onSelectedRecord={setSelectedRecord}
      />
      <NewRecord
        selectedTable={selectedTable}
        showNewModal={showNewModal}
        setShowNewModal={setShowNewModal}
        setRefreshList={setRefreshList}
      />
    </div>
  );
}
