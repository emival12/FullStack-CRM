import { useEffect, useState } from "react";

import { ENDPOINTS } from "@/api/endpoints";
import { useLabels } from "@/context/Label/Label";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useFeedback } from "@/hooks/useFeedback";
import LoadingScreen from "@/components/LoadingScreen/LoadingScreen";
import ScreenAdaptiveSidebar from "@/components/ScreenAdaptiveSidebar/ScreenAdaptiveSidebar";

import type {
  SidebarStructure,
  TablesSidebarProps,
} from "./TablesSidebar.types";
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
