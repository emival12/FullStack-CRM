import axios from "axios";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/K";
import TablesSidebarAccordion from "./TablesSidebarAccordion";
import LoadingScreen from "../../components/LoadingScreen";

import "bootstrap-icons/font/bootstrap-icons.css";
import { Col, Button, Offcanvas } from "react-bootstrap";
import { TABLES_LABEL } from "../../config/IT";

/**
 * Shows a list of record
 *
 * @param {Object} props.selectedTable      - Table currently selected
 * @param {Function} props.onSelectedTable  - Function to update the selected table
 */
export default function TablesSidebar({ selectedTable, onSelectedTable }) {
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

  const phoneSidebar = () => {
    return (
      <>
        {/* Button to open the sidebar on mobile*/}
        <Col
          xs={12}
          className="d-md-none d-flex justify-content-center align-items-center"
        >
          <div className="p-3 w-100">
            <Button
              className="w-100 d-flex align-items-center justify-content-center"
              onClick={toggleSidebar}
            >
              <i className="bi bi-list fs-5 pe-1"></i>
              {TABLES_LABEL}
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
            <TablesSidebarAccordion
              data={tables}
              selectedElement={selectedTable}
              onSelectElement={(table) => {
                onSelectedTable(table);
                toggleSidebar();
              }}
            />
          </Offcanvas.Body>
        </Offcanvas>
      </>
    );
  };

  const desktopSidebar = () => {
    return (
      <Col xs={12} md={2} className="d-none d-md-block pe-0">
        <div className="pt-3 pb-3 ps-3 pe-2">
          <TablesSidebarAccordion
            data={tables}
            selectedElement={selectedTable}
            onSelectElement={onSelectedTable}
          />
        </div>
      </Col>
    );
  };

  return (
    <>
      {phoneSidebar()}
      {desktopSidebar()}
    </>
  );
}
