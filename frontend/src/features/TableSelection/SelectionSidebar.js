import axios from "axios";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/K";
import AccordionList from "./AccordionList";
import LoadingScreen from "../../components/LoadingScreen";

/**
 * Shows a list of record
 *
 * @param {Object} props.selectedTable      - Table currently selected
 * @param {Function} props.onSelectedTable  - Function to update the selected table
 */
export default function SelectionSidebar({ selectedTable, onSelectedTable }) {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState([]);

  useEffect(() => {
    setLoading(true);
    axios
      .get(API_BASE_URL + "/tables")
      .then((res) => {
        console.log("Tables List Received:", res.data);
        setTables(res.data);
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <AccordionList
      data={tables}
      selectedElement={selectedTable}
      onSelectElement={onSelectedTable}
    />
  );
}
