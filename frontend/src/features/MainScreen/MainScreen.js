import { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Outlet } from "react-router-dom";
import SelectionSidebar from "../TableSelection/SelectionSidebar";

export default function MainScreen() {
  const [selectedTable, setSelectedTable] = useState();

  return (
    <Container className="p-0" fluid>
      <Row>
        <Col xs={2}>
          <SelectionSidebar
            selectedTable={selectedTable}
            onSelectedTable={setSelectedTable}
          />
        </Col>
        <Col>
          <Outlet context={{ selectedTable }} />
        </Col>
      </Row>
    </Container>
  );
}
