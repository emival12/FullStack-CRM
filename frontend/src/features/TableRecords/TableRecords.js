import axios from "axios";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import MissingPage from "../../components/MissingPage";
import LoadingScreen from "../../components/LoadingScreen";
import { MISSING_TABLE_LABEL } from "../../config/IT";
import { API_BASE_URL } from "../../config/K";

export default function TableRecords() {
  const { selectedTable } = useOutletContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedTable) return; // Blocks execution if the selected tabel is not correct

    setLoading(true);
    axios
      .get(API_BASE_URL + "/table/" + selectedTable?.key)
      .then((res) => {
        console.log("Record List Received:", res.data);
        //setTables(res.data);
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (!selectedTable) return <MissingPage MissingText={MISSING_TABLE_LABEL} />;

  if (loading) return <LoadingScreen />;

  return <p>Table Selected: {selectedTable?.label}</p>;
}
