import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContext';
import { SparklesIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export const NavBar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar className="glass-navbar py-5" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/" className="flex items-center gap-3 group">
          <div className="bg-teal-600 p-2.5 rounded-[14px] group-hover:rotate-12 transition-all duration-500 shadow-lg shadow-teal-600/20">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-800 group-hover:text-teal-600 transition-colors">
            Clinova
          </span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0 focus:shadow-none" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto items-center gap-2">
            {!isAuthenticated ? (
              <>
                <Nav.Link as={Link} to="/login" className="nav-link-clinova">
                  Login
                </Nav.Link>
                <Link to="/register" className="btn-primary-clinova ml-4 no-underline text-xs">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                {user?.role === 'PATIENT' && (
                  <>
                    <Nav.Link as={Link} to="/patient/dashboard" className="nav-link-clinova">
                      Dashboard
                    </Nav.Link>
                    <Nav.Link as={Link} to="/patient/book-appointment" className="nav-link-clinova">
                      Book Visit
                    </Nav.Link>
                  </>
                )}
                {user?.role === 'DOCTOR' && (
                  <>
                    <Nav.Link as={Link} to="/doctor/dashboard" className="nav-link-clinova">
                      Workspace
                    </Nav.Link>
                  </>
                )}
                {user?.role === 'ADMIN' && (
                  <>
                    <Nav.Link as={Link} to="/admin/dashboard" className="nav-link-clinova">
                      Command Center
                    </Nav.Link>
                  </>
                )}
                
                <div className="flex items-center gap-4 ml-6 pl-6 border-l border-slate-100">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-slate-800 leading-tight">
                      {user?.email.split('@')[0]}
                    </span>
                    <span className={`text-[9px] font-black tracking-[0.2em] uppercase ${
                      user?.role === 'ADMIN' ? 'text-indigo-500' : 
                      user?.role === 'DOCTOR' ? 'text-teal-500' : 'text-blue-500'
                    }`}>
                      {user?.role}
                    </span>
                  </div>
                  
                  <button 
                    onClick={handleLogout}
                    className="p-3 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-2xl transition-all"
                    title="Logout"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
