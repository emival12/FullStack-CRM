import { useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Outlet, useParams } from "react-router-dom";
import SetupSidebar from "../Setup/SetupSidebar";

export default function SetupMainPage() {
  const { tableKey, sectionKey, recordId } = useParams();
  const [refreshSidebar, setRefreshSidebar] = useState(false);

  return (
    <Container className="p-0" fluid>
      <Row>
        <Col>
          <div className="p-2 ps-3 fs-4 fw-bold text-bg-danger"> SETTINGS </div>
        </Col>
      </Row>
      <Row>
        <SetupSidebar
          tableKey={tableKey}
          sectionKey={sectionKey}
          refreshSidebar={refreshSidebar}
        />

        <Col xs={12} md={10} className="ps-md-0">
          <div className="h-100 pt-3 pb-3 ps-3 ps-md-2 pe-3">
            <Outlet
              context={{
                tableKey,
                sectionKey,
                recordId,
                refreshSidebar,
                setRefreshSidebar,
              }}
            />
          </div>
        </Col>
      </Row>
    </Container>
  );
}
