import { Button, Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';

const REFERENCES = [
  { to: '/refs/coordinates', label: 'Координаты (Coordinates)' },
  { to: '/refs/organizations', label: 'Организации (Organization)' },
  { to: '/refs/persons', label: 'Люди (Person)' },
  { to: '/refs/addresses', label: 'Адреса (Address)' },
  { to: '/refs/locations', label: 'Локации (Location)' },
];

/** Каркас страниц: меню для переходов между разделами системы. */
export function AppLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <>
      <Navbar bg="dark" data-bs-theme="dark" expand="lg" sticky="top">
        <Container fluid>
          <Navbar.Brand as={Link} to="/products">
            ИС «Продукция»
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-menu" />
          <Navbar.Collapse id="main-menu">
            <Nav className="me-auto">
              <Nav.Link as={NavLink} to="/products">
                Продукция
              </Nav.Link>
              <NavDropdown title="Связанные объекты" active={pathname.startsWith('/refs/')}>
                {REFERENCES.map((item) => (
                  <NavDropdown.Item key={item.to} as={NavLink} to={item.to}>
                    {item.label}
                  </NavDropdown.Item>
                ))}
              </NavDropdown>
              <Nav.Link as={NavLink} to="/special">
                Спецоперации
              </Nav.Link>
            </Nav>
            <div className="d-flex align-items-center gap-3">
              <Navbar.Text>
                <i className="bi bi-person-circle me-1" />
                {user?.username}
              </Navbar.Text>
              <Button variant="outline-light" size="sm" onClick={logout}>
                <i className="bi bi-box-arrow-right me-1" />
                Выйти
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container fluid className="py-4 px-4">
        <Outlet />
      </Container>
    </>
  );
}
