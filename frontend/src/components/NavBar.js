import { Navbar, Nav, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import { PATH_DATABASE } from "../config/K";
import { DATABASE_LABEL } from "../config/IT";

export default function NavBar() {
  return (
    <Navbar expand="lg" className="bg-body-tertiary">
      <Container>
        <Navbar.Brand>
          <img
            src="/brand.png"
            height="30"
            className="d-inline-block align-top"
            alt="Brand Logo"
          />
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to={PATH_DATABASE}>
              {DATABASE_LABEL}
            </Nav.Link>
            <Nav.Link as={Link} to="/TOBE">
              TOBE
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
