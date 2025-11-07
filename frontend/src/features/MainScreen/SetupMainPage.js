import { useState } from "react";
import { Container, Row, Col, Form, Nav } from "react-bootstrap";
import { Outlet, useParams } from "react-router-dom";
import SetupSidebar from "../Setup/SetupSidebar";

export default function SetupMainPage() {
  const { tableKey, sectionKey } = useParams();
  const [selectedTableKey, setSelectedTableKey] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  const actualTableKey = selectedTableKey || tableKey;
  const actualSectionKey = selectedSection || sectionKey;

  return (
    <Container className="p-0" fluid>
      <Row>
        <Col>
          <div className="p-2 ps-3 fs-4 fw-bold text-bg-danger"> SETTINGS </div>
        </Col>
      </Row>
      <Row>
        <SetupSidebar
          selectedTableKey={actualTableKey}
          setSelectedTableKey={setSelectedTableKey}
          selectedSection={actualSectionKey}
          setSelectedSection={setSelectedSection}
        />

        <Col xs={12} md={10} className="ps-md-0">
          <div className="h-100 pt-3 pb-3 ps-3 ps-md-2 pe-3">
            <Outlet context={{ actualTableKey, actualSectionKey }} />
          </div>
        </Col>
      </Row>
    </Container>
  );
}
