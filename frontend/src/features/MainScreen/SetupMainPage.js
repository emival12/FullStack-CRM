import { useEffect, useState } from "react";
import { Container, Row, Col, Form, Nav } from "react-bootstrap";
import { Outlet, useParams } from "react-router-dom";
import SetupSidebar from "../Setup/SetupSidebar";

export default function SetupMainPage() {
  const { tableKey, sectionKey } = useParams();
  const [selectedTableKey, setSelectedTableKey] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [refreshSidebar, setRefreshSidebar] = useState(false);

  const actualTableKey = selectedTableKey || tableKey;
  const actualSectionKey = selectedSection || sectionKey;

  //If I'm in the setup page with a table selected and I click again on setup I'll be redirected on the starting setupPage
  //this code clear the selections on the buttons/sidebars
  useEffect(() => {
    if (!tableKey || tableKey != selectedTableKey) {
      setSelectedTableKey(null);
      setSelectedSection(null);
      setRefreshSidebar(!refreshSidebar);
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
          selectedTableKey={actualTableKey}
          setSelectedTableKey={setSelectedTableKey}
          selectedSection={actualSectionKey}
          setSelectedSection={setSelectedSection}
          setSelectedRecord={setSelectedRecord}
          refreshSidebar={refreshSidebar}
        />

        <Col xs={12} md={10} className="ps-md-0">
          <div className="h-100 pt-3 pb-3 ps-3 ps-md-2 pe-3">
            <Outlet
              context={{
                selectedTableKey: actualTableKey,
                selectedSectionKey: actualSectionKey,
                setSelectedTableKey,
                setSelectedSection,
                refreshSidebar,
                setRefreshSidebar,
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
