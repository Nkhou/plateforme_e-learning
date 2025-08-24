import React from 'react';
import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

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
      
      // Store tokens
      if (response.data.access) {
        localStorage.setItem('accessToken', response.data.access);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        console.log("Access token stored");
      }
      if (response.data.refresh) {
        localStorage.setItem('refreshToken', response.data.refresh);
        console.log("Refresh token stored");
      }
      
      console.log("Navigating to dashboard...");
      navigate('/dashboard/');
      
    } catch (error: any) {
      console.error("Login error:", error);
      console.error("Error response:", error.response);
      setError(error.response?.data?.error || error.response?.data?.detail || 'Failed to login');
    }
  }


  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark navbar-expand-lg">
        <div className="container-fluid">
          <span className="navbar-brand">My Navbar</span>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-grow-1" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="container-fluid h-100">
          <div className="row h-100 justify-content-end align-items-center">
            {/* Login section */}
            <div className="col-md-6 col-lg-5 col-xl-4">
              <div className="card shadow p-4 rounded">
                <div className="card-body">
                  <h4 className='mb-4 text-center'>Login</h4>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <input
                        type="email"
                        className="form-control form-control-lg"
                        placeholder="Email"
                        value={email}
                        onChange={handleEmail}
                        autoComplete="email"
                      />
                    </div>

                    <div className="mb-3">
                      <input
                        type="password"
                        className="form-control form-control-lg"
                        placeholder="Password"
                        value={password}
                        onChange={handlePassword}
                        autoComplete="current-password"
                      />
                      {error && (
                        <div className="text-danger small mt-1">
                          {error}
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      
                      <button 
                        type="submit" 
                        className="btn btn-primary btn-lg w-100"
                      >
                        Login
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Content section */}
            <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center">
              <div className="bg-white bg-opacity-10 rounded p-5 w-100 h-75 d-flex align-items-center justify-content-center">
                <div className="text-center text-white">
                  <h2>Hello Everyone</h2>
                  <p className="mb-0">Welcome to our platform. Please login to access your dashboard.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-white py-3">
        <div className="container-fluid">
          <p className="mb-0 text-center">&copy; 2025 My Website</p>
        </div>
      </footer>
    </div>
  );
}

export default FirstPage;