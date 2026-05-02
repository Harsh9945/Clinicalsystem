import React, { useContext } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export const HomePage = () => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <Container className="py-5">
      <Row className="align-items-center my-5">
        <Col md={6}>
          <h1 className="mb-4 display-3 fw-bold" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Clinical System
          </h1>
          <p className="lead mb-4 fw-normal text-muted" style={{ fontSize: '1.2rem' }}>
            Manage your healthcare appointments seamlessly. Book appointments with verified doctors,
            track consultations, and receive AI-powered health insights.
          </p>
          {!isAuthenticated ? (
            <div>
              <Link to="/login">
                <Button variant="primary" size="lg" className="me-3">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline-primary" size="lg">
                  Register
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-muted">Welcome back! Check your dashboard for more details.</p>
          )}
        </Col>
        <Col md={6} className="text-center">
          <div style={{ fontSize: '6rem' }}>👨‍⚕️</div>
        </Col>
      </Row>

      {/* Features */}
      <Row className="my-5">
        <Col md={4} className="mb-4">
          <Card className="h-100 glass-card border-0 p-2">
            <Card.Body>
              <h5 className="card-title">📅 Easy Booking</h5>
              <p className="card-text">
                Book appointments with verified doctors in just a few clicks. Choose your preferred
                date and time.
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card className="h-100 glass-card border-0 p-2">
            <Card.Body>
              <h5 className="card-title">🔒 Secure & Safe</h5>
              <p className="card-text">
                Your medical information is protected with JWT authentication and secure data
                encryption.
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card className="h-100 glass-card border-0 p-2">
            <Card.Body>
              <h5 className="card-title">🤖 AI Health Insights</h5>
              <p className="card-text">
                Get AI-powered health summaries and personalized recommendations based on your
                symptoms.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Features */}
      <Row className="my-5">
        <Col md={4} className="mb-4">
          <Card className="h-100 glass-card border-0 p-2">
            <Card.Body>
              <h5 className="card-title">👨 For Patients</h5>
              <ul className="list-unstyled">
                <li>✓ Browse verified doctors</li>
                <li>✓ Book & manage appointments</li>
                <li>✓ View consultations</li>
                <li>✓ Get health recommendations</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card className="h-100 glass-card border-0 p-2">
            <Card.Body>
              <h5 className="card-title">👩‍⚕️ For Doctors</h5>
              <ul className="list-unstyled">
                <li>✓ Manage appointments</li>
                <li>✓ View patient consultations</li>
                <li>✓ Add consultation notes</li>
                <li>✓ Track patient history</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-4">
          <Card className="h-100 glass-card border-0 p-2">
            <Card.Body>
              <h5 className="card-title">⚙️ For Admins</h5>
              <ul className="list-unstyled">
                <li>✓ Verify doctors</li>
                <li>✓ Monitor system</li>
                <li>✓ View statistics</li>
                <li>✓ Manage users</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
