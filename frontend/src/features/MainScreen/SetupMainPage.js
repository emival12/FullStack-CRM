import { useEffect, useState } from "react";
import { Container, Row, Col, Form, Nav } from "react-bootstrap";
import { Outlet, useParams } from "react-router-dom";
import SetupSidebar from "../Setup/SetupSidebar";

export default function SetupMainPage() {
  const { tableKey, sectionKey } = useParams();
  const [selectedTableKey, setSelectedTableKey] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  useEffect(() => {
    if (!tableKey || tableKey != selectedTableKey) {
      setSelectedTableKey(null);
      setSelectedSection(null);
    }
  }, [tableKey]);

  return (
    <Container className="p-0" fluid>
      <Row>
        <Col>
          <div className="p-2 ps-3 fs-4 fw-bold text-bg-danger"> SETTINGS </div>
        </Col>
      </Row>
      <Row>
        <SetupSidebar
          selectedTableKey={selectedTableKey || tableKey}
          setSelectedTableKey={setSelectedTableKey}
          selectedSection={selectedSection || sectionKey}
          setSelectedSection={setSelectedSection}
        />

        <Col xs={12} md={10} className="ps-md-0">
          <div className="h-100 pt-3 pb-3 ps-3 ps-md-2 pe-3">
            <Outlet context={{}} />
          </div>
        </Col>
      </Row>
    </Container>
  );
}
