import { useEffect, useState } from "react";
import { Container, Row, Col, Button, Offcanvas } from "react-bootstrap";
import { Outlet, useParams } from "react-router-dom";
import SelectionSidebar from "../TableSelection/SelectionSidebar";
import { TABLES_LABEL } from "../../config/IT";

export default function MainScreen() {
  const { tableName } = useParams();
  const [selectedTable, setSelectedTable] = useState(null);

  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar(!showSidebar);

  useEffect(() => {
    if (!tableName) {
      setSelectedTable(null);
    }
  }, [tableName]);

  return (
    <Container className="p-0" fluid>
      <Row>
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
            <SelectionSidebar
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
            <SelectionSidebar
              selectedTable={selectedTable}
              onSelectedTable={setSelectedTable}
            />
          </div>
        </Col>

        <Col xs={12} md={10} className="ps-0">
          <div className="h-100 pt-3 pb-3 ps-2 pe-3">
            <Outlet context={{ selectedTable }} />
          </div>
        </Col>
      </Row>
    </Container>
  );
}
