import { useEffect, useState } from "react";
import { Container, Row, Col, Button, Offcanvas } from "react-bootstrap";
import { Outlet, useParams } from "react-router-dom";
import TablesSidebar from "../TablesSidebar/TablesSidebar";

export default function DatabaseMainPage() {
  const { tableName } = useParams();
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    if (!tableName) {
      setSelectedTable(null);
      setSelectedRecord(null);
    }
  }, [tableName]);

  return (
    <Container className="p-0" fluid>
      <Row>
        <TablesSidebar
          selectedTable={selectedTable}
          onSelectedTable={setSelectedTable}
        />

        <Col xs={12} md={10} className="ps-md-0">
          <div className="h-100 pt-3 pb-3 ps-3 ps-md-2 pe-3">
            <Outlet context={{ selectedTable, setSelectedRecord }} />
          </div>
        </Col>
      </Row>
    </Container>
  );
}
