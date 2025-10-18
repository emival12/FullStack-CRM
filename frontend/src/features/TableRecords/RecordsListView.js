import axios from "axios";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { MISSING_TABLE_LABEL, MISSING_RECORD_LABEL } from "../../config/IT";
import { API_BASE_URL } from "../../config/K";
import MissingPage from "../../components/MissingPage";
import LoadingScreen from "../../components/LoadingScreen";
import RecordsList from "./RecordsList";

export default function RecordsListView() {
  const { selectedTable } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    if (!selectedTable) return; // Blocks execution if the selected tabel is not correct

    setLoading(true);
    axios
      .get(API_BASE_URL + "/table/" + selectedTable?.key)
      .then((res) => {
        console.log("Record List Received:", res.data);
        setRecords(res.data);
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, [selectedTable]);

  if (!selectedTable) return <MissingPage MissingText={MISSING_TABLE_LABEL} />;
  if (loading) return <LoadingScreen />;
  if (records.length === 0)
    return <MissingPage MissingText={MISSING_RECORD_LABEL} />;

  return (
    <div>
      <RecordsList records={records} />
    </div>
  );
}
