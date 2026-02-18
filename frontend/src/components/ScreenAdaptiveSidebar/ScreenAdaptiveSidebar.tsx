import { Col, Button, Offcanvas } from "react-bootstrap";
import type {
  ScreenAdaptiveSidebarProps,
  DesktopSidebarProps,
  ScreenAdaptiveSidebarProps as PhoneSidebarProps,
} from "./ScreenAdaptiveSidebar.types.js";

const PhoneSidebar = ({
  sidebarComponent,
  labelPhoneButton,
  toggleSidebar,
  showSidebar,
}: PhoneSidebarProps): React.ReactElement => (
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

const DesktopSidebar = ({
  sidebarComponent,
}: DesktopSidebarProps): React.ReactElement => (
  <Col xs={12} md={2} className="d-none d-md-block pe-0">
    <div className="pt-3 pb-3 ps-3 pe-2">{sidebarComponent}</div>
  </Col>
);

/**
 * Handles the different graphics to the sidebar for phone and desktop
 */
export default function ScreenAdaptiveSidebar({
  sidebarComponent,
  labelPhoneButton,
  toggleSidebar,
  showSidebar,
}: ScreenAdaptiveSidebarProps): React.ReactElement {
  return (
    <>
      <PhoneSidebar
        sidebarComponent={sidebarComponent}
        labelPhoneButton={labelPhoneButton}
        toggleSidebar={toggleSidebar}
        showSidebar={showSidebar}
      />
      <DesktopSidebar sidebarComponent={sidebarComponent} />
    </>
  );
}
