import "bootstrap-icons/font/bootstrap-icons.css";
import { useState } from "react";
import { Col, Button, Offcanvas } from "react-bootstrap";

/**
 * Shows a list of record
 *
 * @param {Object} props.sidebarComponent       - Component showed in the sidebar
 * @param {Function} props.labelPhoneButton     - Label used in the mobile button viasualization
 */
export default function ScreenAdaptiveSidebar({
  sidebarComponent,
  labelPhoneButton,
}) {
  //Mobile variables
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar(!showSidebar);

  const phoneSidebar = () => {
    return (
      <>
        {/* Button to open the sidebar on mobile*/}
        <Col
          xs={12}
          className="d-md-none d-flex justify-content-center align-items-center"
        >
          <div className="p-3 w-100">
            <Button
              className="w-100 d-flex align-items-center justify-content-center"
              onClick={toggleSidebar}
            >
              <i className="bi bi-list fs-5 pe-1"></i>
              {labelPhoneButton}
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
            <Offcanvas.Title>{labelPhoneButton}</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>{sidebarComponent}</Offcanvas.Body>
        </Offcanvas>
      </>
    );
  };

  const desktopSidebar = () => {
    return (
      <Col xs={12} md={2} className="d-none d-md-block pe-0">
        <div className="pt-3 pb-3 ps-3 pe-2">{sidebarComponent}</div>
      </Col>
    );
  };

  return (
    <>
      {phoneSidebar()}
      {desktopSidebar()}
    </>
  );
}
