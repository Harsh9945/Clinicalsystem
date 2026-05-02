import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContext';
import './Navbar.css';

export const NavBar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar className="glass-navbar py-3" expand="lg" sticky="top" variant="light">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          🏥 Clinical System
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {!isAuthenticated ? (
              <>
                <Nav.Link as={Link} to="/login">
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  Register
                </Nav.Link>
              </>
            ) : (
              <>
                {user?.role === 'PATIENT' && (
                  <>
                    <Nav.Link as={Link} to="/patient/dashboard">
                      Dashboard
                    </Nav.Link>
                    <Nav.Link as={Link} to="/patient/book-appointment">
                      Book Appointment
                    </Nav.Link>
                  </>
                )}
                {user?.role === 'DOCTOR' && (
                  <>
                    <Nav.Link as={Link} to="/doctor/dashboard">
                      Dashboard
                    </Nav.Link>
                  </>
                )}
                {user?.role === 'ADMIN' && (
                  <>
                    <Nav.Link as={Link} to="/admin/dashboard">
                      Admin Panel
                    </Nav.Link>
                  </>
                )}
                <div className="navbar-user-info ms-3 d-flex align-items-center">
                  <span className="badge bg-primary me-2">{user?.role}</span>
                  <small className="text-dark fw-medium">{user?.email}</small>
                </div>
                <Button variant="outline-primary" size="sm" onClick={handleLogout} className="ms-3 rounded-pill px-3">
                  Logout
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
