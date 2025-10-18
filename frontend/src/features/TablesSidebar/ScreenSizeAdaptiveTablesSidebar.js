import { useEffect, useState } from "react";
import { Col, Button, Offcanvas } from "react-bootstrap";
import TablesSidebar from "./TablesSidebar";
import { TABLES_LABEL } from "../../config/IT";

/**
 * Shows a sidebar with dynamic dimension based on the size of the screen
 *
 * @param {Object} props.selectedTable      - Table currently selected
 * @param {Function} props.onSelectedTable  - Function to update the selected table
 */
export default function ScreenSizeAdaptiveTablesSidebar({
  selectedTable,
  setSelectedTable,
}) {
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar(!showSidebar);

  return (
    <>
      {/* Button to open the sidebar on mobile*/}
      <Col
        xs={12}
        className="d-md-none d-flex justify-content-center align-items-center"
      >
        <div className="p-3 w-100">
          <Button className="w-100" onClick={toggleSidebar}>
            ☰ Tables
          </Button>
        </div>
      </Col>

      {/* Offcanvas sidebar for mobile */}
      <Offcanvas
        show={showSidebar}
        onHide={toggleSidebar}
        className="d-md-none"
        responsive="md"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>{TABLES_LABEL}</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <TablesSidebar
            selectedTable={selectedTable}
            onSelectedTable={(table) => {
              setSelectedTable(table);
              toggleSidebar();
            }}
          />
        </Offcanvas.Body>
      </Offcanvas>

      {/* Sidebar for desktop */}
      <Col xs={12} md={2} className="d-none d-md-block pe-0">
        <div className="pt-3 pb-3 ps-3 pe-2">
          <TablesSidebar
            selectedTable={selectedTable}
            onSelectedTable={setSelectedTable}
          />
        </div>
      </Col>
    </>
  );
}
