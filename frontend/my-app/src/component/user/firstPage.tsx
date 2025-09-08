import React, { useEffect } from 'react';
import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
// import  type {User} from '../../layout';
import api from '../../api/api';
export interface User {
  id:number
  email: string;
  username: string;
  privilege: string;
}
// type Props = {
//   user: User;
// };

const FirstPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  
  const navigate = useNavigate();
useEffect(() => {
    if (user) {
      console.log("User state updated:", user);
      console.log("Privilege:", user.privilege);
      
      if (user.privilege === 'A') {
        navigate('/admin');
      }else if (user.privilege === 'F'){
          navigate('/cours');
      }
       else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);
  const handleEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handlePassword = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Login attempt:', { email, password });
    
    try {
      const response = await api.post('login/', {
        email: email,
        password: password
      });
      
      console.log("Login successful - Full response:", response);
      console.log("Response data:", response.data);
      setUser(response.data.user);
      console.log('userrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr', user);
      console.log('user', response.data.user);
      // Store tokens
      // if (response.data.access) {
      //   // localStorage.setItem('accessToken', response.data.access);
      //   // api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      //   console.log("Access token stored");
      // }
      // if (response.data.refresh) {
      //   // localStorage.setItem('refreshToken', response.data.refresh);
      //   console.log("Refresh token stored");
      // }
      
      console.log("Navigating to dashboard...", user?.privilege);
      if ((user?.privilege === 'A'  ||  user?.privilege ===	'Admin'))
      {
        navigate('/admin/');
      }
      else{
        navigate('/dashboard/');
      }
      
    } catch (error: any) {
      console.error("Login error:", error);
      console.error("Error response:", error.response);
      setError(error.response?.data?.error || error.response?.data?.detail || 'Failed to login');
    }
  }

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ 
      background: 'linear-gradient(135deg, #052c65 0%, #2c6aa2 50%, #052c65 100%)',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* Navbar */}
      <nav className="navbar navbar-dark" style={{ background: 'rgba(5, 44, 101, 0.9)' }}>
        <div className="container-fluid">
          <span className="navbar-brand fw-bold">
            <i className="bi bi-lock-fill me-2"></i>
            platform
          </span>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-grow-1 d-flex align-items-center py-4">
        <div className="container-fluid h-100">
          <div className="row h-100 justify-content-end">
            {/* Content section - positioned at bottom left */}
            <div className="col-md-6 d-flex align-items-end">
              <div className="text-white mb-5 ms-md-5 ps-md-3" style={{ maxWidth: '500px' }}>
                <h2 className="display-4 fw-bold mb-3">Hello Everyone</h2>
                <p className="fs-5 opacity-75">Welcome to our secure platform. Please login to access your personalized dashboard with all the latest features and updates.</p>
              </div>
            </div>

            {/* Login section - centered on the right */}
            <div className="col-md-5 d-flex align-items-center justify-content-center py-5">
              <div className="card shadow-lg p-4 rounded-3" style={{ 
                width: '100%', 
                maxWidth: '420px',
                background: 'rgba(255, 255, 255, 0.93)',
                border: 'none'
              }}>
                <div className="card-body">
                  <div className="text-center mb-4">
                    <h3 className='fw-bold' style={{ color: '#052c65' }}>Welcome Back</h3>
                    <p className="text-muted">Sign in to continue to your account</p>
                  </div>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label fw-semibold" style={{ color: '#052c65' }}>Email</label>
                      <input
                        id="email"
                        type="email"
                        className="form-control form-control-lg"
                        placeholder="Enter your email"
                        value={email}
                        onChange={handleEmail}
                        autoComplete="email"
                        style={{ 
                          background: '#f8f9fa',
                          border: '1px solid #ced4da',
                          borderRadius: '8px'
                        }}
                      />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="password" className="form-label fw-semibold" style={{ color: '#052c65' }}>Password</label>
                      <input
                        id="password"
                        type="password"
                        className="form-control form-control-lg"
                        placeholder="Enter your password"
                        value={password}
                        onChange={handlePassword}
                        autoComplete="current-password"
                        style={{ 
                          background: '#f8f9fa',
                          border: '1px solid #ced4da',
                          borderRadius: '8px'
                        }}
                      />
                      {error && (
                        <div className="alert alert-danger mt-3 py-2">
                          <i className="bi bi-exclamation-circle me-2"></i>
                          {error}
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      <button 
                        type="submit" 
                        className="btn btn-primary btn-lg w-100 fw-bold py-2"
                        style={{ 
                          backgroundColor: '#052c65',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '1.1rem'
                        }}
                      >
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Login
                      </button>
                    </div>
                    
                    <div className="text-center mt-4">
                      <a href="#" className="text-decoration-none" style={{ color: '#052c65' }}>
                        Forgot your password?
                      </a>
                    </div>
                  </form>
                  
                  {/* <div className="text-center mt-4 pt-3 border-top">
                    <p className="text-muted">Don't have an account? 
                      <a href="#" className="text-decoration-none fw-semibold ms-2" style={{ color: '#052c65' }}>
                        Sign up
                      </a>
                    </p> */}
                  {/* </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-3" style={{ background: 'rgba(5, 44, 101, 0.9)' }}>
        <div className="container-fluid">
          <p className="mb-0 text-center text-white">
            &copy; 2025 platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default FirstPage;