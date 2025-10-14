import axios from "axios";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/K";
import AccordionList from "./AccordionList";
import LoadingScreen from "../../components/LoadingScreen";

export default function SelectionSidebar() {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState();

  useEffect(() => {
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
      onSelectElement={setSelectedTable}
    />
  );
}
