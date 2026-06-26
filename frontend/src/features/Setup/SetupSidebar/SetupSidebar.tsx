import { useEffect, useState } from "react";
import { FloatingLabel, Form, ListGroup } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

import { Sections } from "@/types/routing.types";
import { ENDPOINTS } from "@/api/endpoints";
import { ROUTES } from "@/config/routes";
import { useLabels } from "@/context/Label/Label";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useFeedback } from "@/hooks/useFeedback";
import LoadingScreen from "@/components/LoadingScreen/LoadingScreen";
import ScreenAdaptiveSidebar from "@/components/ScreenAdaptiveSidebar/ScreenAdaptiveSidebar";

import { PlainSidebarStructure, SetupSidebarProps } from "./SetupSidebar.types";

/**
 * Shows a list of options, each option is a tables
 */
export default function SetupSidebar({
  tableKey,
  sectionKey,
  refreshSidebar,
}: SetupSidebarProps): React.ReactElement | null {
  const { getLabel } = useLabels();
  const { showErrorToast } = useFeedback();
  const {
    data: tables,
    loading,
    error,
  } = useApiQuery<PlainSidebarStructure>(ENDPOINTS.sidebar.plainTables, {
    refetchKey: refreshSidebar,
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (error) showErrorToast(error, "SETUP_SIDEBAR");
  }, [error, showErrorToast]);

  //Mobile variables
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar(!showSidebar);

  const renderSidebarContent = () => {
    if (loading) return <LoadingScreen compact={true} />;
    if (!tables) return null;
    return sidebar(tables);
  };

  const sidebar = (tables: PlainSidebarStructure) => {
    return (
      <>
        <FloatingLabel
          controlId="floatingInput"
          label={getLabel("SETUP.TABLE_SELECTION")}
          className="mb-3"
        >
          <Form.Select
            value={tableKey || ""}
            onChange={(e) => {
              toggleSidebar(); //useful only for the mobile

              const value = e.target.value || null;
              const path = value
                ? ROUTES.setup.table(value)
                : ROUTES.setup.root;
              navigate(path);
            }}
          >
            <option value=""></option>
            {tables.map((table) => (
              <option key={table.key} value={table.key}>
                {table.label}
              </option>
            ))}
          </Form.Select>
        </FloatingLabel>

        {tableKey ? (
          <ListGroup className="mt-2" variant="pills">
            {Object.values(Sections).map((section) => (
              <ListGroup.Item
                action
                as={Link}
                to={ROUTES.setup.section(tableKey, section)}
                key={section}
                active={section === sectionKey}
                onClick={() => {
                  toggleSidebar(); //useful only for the mobile
                }}
              >
                {getLabel(`SETUP.SECTIONS.${section.toUpperCase()}`)}
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : null}
      </>
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
