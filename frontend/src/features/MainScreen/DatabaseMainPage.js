import { useEffect, useState } from "react";
import { Container, Row, Col, Button, Offcanvas } from "react-bootstrap";
import { Outlet, useParams } from "react-router-dom";
import ScreenSizeAdaptiveTablesSidebar from "../TablesSidebar/ScreenSizeAdaptiveTablesSidebar";

export default function DatabaseMainPage() {
  const { tableName } = useParams();
  const [selectedTable, setSelectedTable] = useState(null);

  useEffect(() => {
    if (!tableName) {
      setSelectedTable(null);
    }
  }, [tableName]);

  return (
    <Container className="p-0" fluid>
      <Row>
        <ScreenSizeAdaptiveTablesSidebar
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
        />

        <Col xs={12} md={10} className="ps-md-0">
          <div className="h-100 pt-3 pb-3 ps-3 ps-md-2 pe-3">
            <Outlet context={{ selectedTable }} />
          </div>
        </Col>
      </Row>
    </Container>
  );
}
