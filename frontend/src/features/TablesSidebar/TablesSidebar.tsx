import axios from "axios";
import { useEffect, useState } from "react";
import type {
  SidebarStructure,
  TablesSidebarProps,
} from "./TableSidebar.types";

import { API_BASE_URL } from "config/K";
import { useLabels } from "context/Label/Label";
import ScreenAdaptiveSidebar from "components/ScreenAdaptiveSidebar/ScreenAdaptiveSidebar";
import LoadingScreen from "components/LoadingScreen/LoadingScreen";
import TablesSidebarAccordion from "./TablesSidebarAccordion";

/**
 * Shows a list of availables tables grouped by category and recordTypes
 */
export default function TablesSidebar({
  tableKey,
}: TablesSidebarProps): React.ReactElement {
  const { getLabel } = useLabels();

  const [loading, setLoading] = useState(true);
  const [tablesData, setTablesData] = useState<SidebarStructure>({});

  //Mobile variables
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar(!showSidebar);

  useEffect(() => {
    setLoading(true);
    axios
      .get<SidebarStructure>(`${API_BASE_URL}/tables`)
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
      labelPhoneButton={getLabel("MOBILE.TABLES_LABEL")}
      toggleSidebar={toggleSidebar}
      showSidebar={showSidebar}
    />
  );
}
