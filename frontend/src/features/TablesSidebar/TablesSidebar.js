import axios from "axios";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/K";
import TablesSidebarAccordion from "./TablesSidebarAccordion";
import LoadingScreen from "../../components/LoadingScreen";

import { TABLES_LABEL } from "../../config/IT";
import ScreenAdaptiveSidebar from "../../components/ScreenAdaptiveSidebar";

/**
 * Shows a list of record
 *
 * @param {Object} props.selectedTableKey       - Table currently selected
 * @param {Function} props.onSelectedTable      - Function to update the selected table
 */
export default function TablesSidebar({ selectedTableKey, onSelectedTable }) {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState([]);

  //Mobile variables
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar(!showSidebar);

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
    <ScreenAdaptiveSidebar
      sidebarComponent={
        <TablesSidebarAccordion
          data={tables}
          selectedElement={selectedTableKey}
          onSelectElement={(table) => {
            onSelectedTable(table);
            toggleSidebar();
          }}
        />
      }
      labelPhoneButton={TABLES_LABEL}
    />
  );
}
