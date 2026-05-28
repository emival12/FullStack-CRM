import { useEffect, useState } from "react";
import { Form, FloatingLabel, ListGroup } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { PlainSidebarStructure, SetupSidebarProps } from "./SetupSidebar.types";

import { useLabels } from "context/Label/Label";
import { useFeedback } from "hooks/useFeedback";
import { useApiQuery } from "hooks/useApiQuery";
import { ENDPOINTS } from "api/endpoints";
import { PATH_SETUP } from "config/K";
import { SECTIONS } from "features/Setup/K_SetupFormsStructure";
import LoadingScreen from "components/LoadingScreen/LoadingScreen";
import ScreenAdaptiveSidebar from "components/ScreenAdaptiveSidebar/ScreenAdaptiveSidebar";

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
              const path = value ? `${PATH_SETUP}/${value}` : PATH_SETUP;
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
            {SECTIONS.map((section) => (
              <ListGroup.Item
                action
                as={Link}
                to={`${PATH_SETUP}/${tableKey}/${section.key}`}
                key={section.key}
                active={section.key === sectionKey}
                onClick={() => {
                  toggleSidebar(); //useful only for the mobile
                }}
              >
                {section.label}
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
