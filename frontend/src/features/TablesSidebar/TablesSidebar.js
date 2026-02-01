import axios from "axios";
import { useEffect, useState } from "react";

import { TABLES_LABEL } from "../../config/IT";
import { API_BASE_URL } from "../../config/K";
import ScreenAdaptiveSidebar from "../../components/ScreenAdaptiveSidebar";
import TablesSidebarAccordion from "./TablesSidebarAccordion";
import LoadingScreen from "../../components/LoadingScreen";

/**
 * Shows a list of availables tables grouped by category and recordTypes
 *
 * @param {String} props.tableKey       - Table currently selected
 */
export default function TablesSidebar({ tableKey }) {
  const [loading, setLoading] = useState(true);
  const [tablesData, setTablesData] = useState([]);

  //Mobile variables
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar(!showSidebar);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/tables`)
      .then((res) => {
        console.log("TablesSidebar - List of Tables Received:", res.data);
        setTablesData(res.data);
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <ScreenAdaptiveSidebar
      sidebarComponent={
        <TablesSidebarAccordion
          tablesData={tablesData}
          tableKey={tableKey}
          toggleSidebar={toggleSidebar}
        />
      }
      labelPhoneButton={TABLES_LABEL}
      toggleSidebar={toggleSidebar}
      showSidebar={showSidebar}
    />
  );
}
