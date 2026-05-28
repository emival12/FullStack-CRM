import { useEffect, useState } from "react";
import type {
  SidebarStructure,
  TablesSidebarProps,
} from "./TableSidebar.types";

import { useLabels } from "context/Label/Label";
import { useFeedback } from "hooks/useFeedback";
import { useApiQuery } from "hooks/useApiQuery";
import { ENDPOINTS } from "api/endpoints";
import ScreenAdaptiveSidebar from "components/ScreenAdaptiveSidebar/ScreenAdaptiveSidebar";
import LoadingScreen from "components/LoadingScreen/LoadingScreen";
import TablesSidebarAccordion from "./TablesSidebarAccordion";

/**
 * Shows a list of availables tables grouped by category and recordTypes
 */
export default function TablesSidebar({
  tableKey,
}: TablesSidebarProps): React.ReactElement | null {
  const { getLabel } = useLabels();
  const { showErrorToast } = useFeedback();
  const {
    data: tablesData,
    loading,
    error,
  } = useApiQuery<SidebarStructure>(ENDPOINTS.sidebar.tables);

  //Mobile variables
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar(!showSidebar);

  useEffect(() => {
    if (error) showErrorToast(error, "TABLE_SIDEBAR");
  }, [error, showErrorToast]);

  const renderSidebarContent = () => {
    if (loading) return <LoadingScreen compact={true} />;
    if (!tablesData) return null;
    return (
      <TablesSidebarAccordion
        tablesData={tablesData}
        tableKey={tableKey}
        toggleSidebar={toggleSidebar}
      />
    );
  };

  return (
    <ScreenAdaptiveSidebar
      sidebarComponent={renderSidebarContent()}
      labelPhoneButton={getLabel("MOBILE.TABLES")}
      toggleSidebar={toggleSidebar}
      showSidebar={showSidebar}
    />
  );
}
