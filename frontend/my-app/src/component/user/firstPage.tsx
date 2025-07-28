import React from 'react';
import { Container, Navbar, Form } from 'react-bootstrap';
import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { MDBContainer, MDBRow, MDBCol } from 'mdb-react-ui-kit';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


function FirstPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handlePassword = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    axios.post('http://localhost:8000/api/login/', {
      email: email,
      password: password
    }, { withCredentials: true })
      .then(() => navigate('/dashboard/'))
      .catch(error => {
        const errorMsg = typeof error.response?.data === 'string'
          ? error.response.data
          : error.response?.data?.error || error.message;
        setError(errorMsg);
      });
  };

  return (
    <div className="full-page-container">
      {/* Navbar - fixed at top */}
      <Navbar bg="dark" variant="dark" expand="lg" className="navbar-custom">
        <Container fluid>
          <Navbar.Brand>My Navbar</Navbar.Brand>
        </Container>
      </Navbar>

      {/* Main content area */}
      <div className="main-layout ">
        {/* Login section - top right */}
        <div className="login-section">
          <MDBContainer className="login-container">
            <MDBRow className="justify-content-end">
              <MDBCol md="6">
                <div className='shadow p-5 rounded bg-white'>
                  <h4 className='mb-4'>Login</h4>
                  <form onSubmit={handleSubmit}>
                    <input 
                      className='form-control form-control-lg mb-4' 
                      name='email'
                      placeholder="Email" 
                      type="email" 
                      value={email} 
                      onChange={handleEmail}
                      autoComplete="email"
                    />
                    <Form.Group className="mb-3" controlId="formBasicPassword">
                      <Form.Control 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={handlePassword} 
                      />
                      <Form.Text className="text-danger">
                        {error}
                      </Form.Text>
                    </Form.Group>
                    <div className="text-center">
                      <button 
                        type="submit" 
                        className="btn login-btn"
                      >
                        Login
                      </button>
                    </div>
                  </form>
                </div>
              </MDBCol>
            </MDBRow>
          </MDBContainer>
        </div>

        {/* Content section with background */}
        <div className="content-section">
          <div className="content-background">
            <div className="content-overlay">
              <h2>Hello Everyone</h2>
              <p>Welcome to our platform. Please login to access your dashboard.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - fixed at bottom */}
      <footer className="footer-custom">
        <Container fluid>
          <p className="mb-0">&copy; 2025 My Website</p>
        </Container>
      </footer>
    </div>
  );
}

export default FirstPage;