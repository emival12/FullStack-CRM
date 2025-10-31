import { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Outlet, useParams } from "react-router-dom";
import TablesSidebar from "../TablesSidebar/TablesSidebar";

export default function DatabaseMainPage() {
  const { tableKey } = useParams();
  const [selectedTableKey, setSelectedTableKey] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    if (!tableKey || tableKey != selectedTableKey) {
      setSelectedTableKey(null);
      setSelectedRecord(null);
    }
  }, [tableKey]);

  return (
    <Container className="p-0" fluid>
      <Row>
        <TablesSidebar
          selectedTableKey={selectedTableKey || tableKey}
          onSelectedTable={setSelectedTableKey}
        />

        <Col xs={12} md={10} className="ps-md-0">
          <div className="h-100 pt-3 pb-3 ps-3 ps-md-2 pe-3">
            <Outlet
              context={{
                selectedTableKey,
                setSelectedTableKey,
                selectedRecord,
                setSelectedRecord,
              }}
            />
          </div>
        </Col>
      </Row>
    </Container>
  );
}
