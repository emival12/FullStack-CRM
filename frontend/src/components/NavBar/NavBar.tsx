import { Navbar, Nav, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

import { PATH_DATABASE, PATH_IMPORT, PATH_SETUP } from "config/K";
import { useAuth } from "context/Auth/Auth";
import { useLabels } from "context/Label/Label";

export default function NavBar(): React.ReactElement {
  const { logout } = useAuth();
  const { getLabel } = useLabels();

  return (
    <Navbar expand="lg" className="bg-body-tertiary">
      <Container>
        <Navbar.Brand>
          <img
            src="/brand.png"
            height="40"
            className="d-inline-block align-top"
            alt="Brand Logo"
          />
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to={PATH_DATABASE}>
              {getLabel("NAVBAR.DATABASE")}
            </Nav.Link>
            <Nav.Link as={Link} to={PATH_IMPORT}>
              {getLabel("NAVBAR.IMPORT")}
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link as={Link} to={PATH_SETUP}>
              <i className="bi bi-gear"></i>
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link
              as="button"
              onClick={() => {
                logout();
              }}
              className="text-danger"
            >
              <i className="bi bi-door-open-fill"></i>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
