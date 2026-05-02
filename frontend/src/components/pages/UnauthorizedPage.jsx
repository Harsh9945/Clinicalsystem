import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export const UnauthorizedPage = () => {
  return (
    <Container className="py-5">
      <Row className="justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Col md={6} className="text-center">
          <h1 className="display-1">🚫</h1>
          <h2 className="mb-3">Access Denied</h2>
          <p className="lead text-muted mb-4">
            You don't have permission to access this page. Please contact an administrator if you
            believe this is a mistake.
          </p>
          <Link to="/">
            <Button variant="primary" size="lg">
              ← Go Back Home
            </Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
};
