import { Container, Row, Col } from "react-bootstrap";
import { Outlet, useParams } from "react-router-dom";

import TablesSidebar from "features/TablesSidebar/TablesSidebar";

export default function DatabaseMainPage(): React.ReactElement {
  const { tableKey, recordId } = useParams();

  return (
    <Container className="p-0" fluid>
      <Row>
        <TablesSidebar tableKey={tableKey} />

        <Col xs={12} md={10} className="ps-md-0">
          <div className="h-100 pt-3 pb-3 ps-3 ps-md-2 pe-3">
            <Outlet
              context={{
                tableKey,
                recordId,
              }}
            />
          </div>
        </Col>
      </Row>
    </Container>
  );
}
