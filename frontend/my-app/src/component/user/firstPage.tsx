import React, { useEffect } from 'react';
import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import EleviaHero from './img';

export interface User {
  id: number
  email: string;
  username: string;
  privilege: string;
}

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

      // Fixed navigation logic based on privilege
      if (user.privilege === 'A' || user.privilege === 'Admin') {
        navigate('/admin');
      } else if (user.privilege === 'F') {
        navigate('/cours');
      } else {
        navigate('/Formation'); // Replaced /dashboard with /Formation
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
    setError('');

    try {
      const response = await api.post('login/', {
        email: email,
        password: password
      });

      console.log("Login successful - Full response:", response);
      console.log("Response data:", response.data);
      
      // Set the user data which will trigger the useEffect navigation
      setUser(response.data.user);

    } catch (error: any) {
      console.error("Login error:", error);
      console.error("Error response:", error.response);
      setError(error.response?.data?.error || error.response?.data?.detail || 'Failed to login');
    }
  }

  return (
    <div
      className="min-vh-100 d-flex flex-column"
      style={{
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        padding: '2rem 0'
      }}
    >
      <div className="flex-grow-1 container-fluid h-100 d-flex align-items-center justify-content-center">
        <div className="row w-100 justify-content-center align-items-stretch" style={{ gap: '4rem' }}>

          {/* IMAGE SECTION - Full Card Size */}
          <div className="col-xl-5 col-lg-7 col-md-10 d-flex">
            <div
              className="card rounded-5 w-100 overflow-hidden"
              style={{
                border: 'none',
                minHeight: '870px',
                background: 'transparent'
              }}
            >
              <div className="card-body p-0 w-100 h-100">
                <EleviaHero />
              </div>
            </div>
          </div>

          {/* LOGIN SECTION - Full Card Size with Left Alignment */}
          <div className="col-xl-6 col-lg-8 col-md-8 d-flex mt-5">
            <div
              className="card  rounded-6 w-100"
              style={{
                border: 'none',
                backdropFilter: 'blur(10px)',
                minHeight: '700px'
              }}
            >
              <div className="card-body d-flex flex-column justify-content-center p-4 p-md-5">
                {/* Login Header - Left Aligned */}
                <div className="mx-auto w-100" style={{ maxWidth: '600px' }}>
                  <div className="mb-5 text-start">
                    <img
                      src="/logo-colored.png"
                      alt="Login"
                      style={{
                        width: '80px',
                        height: '50px',
                        marginBottom: '30px'
                      }}
                    />
                    <h2
                      className="fw-bold mb-3"
                      style={{ fontSize: '2.4rem', color: '#161e38' }}
                    >
                      Connectez-vous
                    </h2>
                    <h4
                      className="fs-6 mb-0"
                      style={{ fontSize: '1.3rem', color: '#666', opacity: 0.9 }}
                    >
                      Entrez vos informations de connexion ci-dessous
                    </h4>
                  </div>
                </div>
                {/* Form - Left Aligned */}
                <div className="mx-auto w-100" style={{ maxWidth: '600px' }}>
                  <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '500px' }}>

                    <div className="mb-4">
                      <label
                        htmlFor="email"
                        className="form-label fw-semibold"
                        style={{ color: '#161e38', fontSize: '0.9rem' }}
                      >
                        Adresse email
                      </label>
                      <input
                        id="email"
                        type="email"
                        className="form-control form-control-lg py-3"
                        placeholder="Votre adresse email"
                        value={email}
                        onChange={handleEmail}
                        autoComplete="email"
                        required
                        style={{
                          border: '2px solid #e9ecef',
                          borderRadius: '10px',
                          fontSize: '1rem',
                          padding: '12px 16px',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#161e38';
                          e.target.style.background = '#fff';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e9ecef';
                          e.target.style.background = '#f8f9fa';
                        }}
                      />
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor="password"
                        className="form-label fw-semibold"
                        style={{ color: '#161e38', fontSize: '0.9rem' }}
                      >
                        Mot de passe
                      </label>
                      <input
                        id="password"
                        type="password"
                        className="form-control form-control-lg py-3"
                        placeholder="Votre mot de passe"
                        value={password}
                        onChange={handlePassword}
                        autoComplete="current-password"
                        required
                        style={{
                          border: '2px solid #e9ecef',
                          borderRadius: '10px',
                          fontSize: '1rem',
                          padding: '12px 16px',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#161e38';
                          e.target.style.background = '#fff';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e9ecef';
                          e.target.style.background = '#f8f9fa';
                        }}
                      />
                    </div>

                    {error && (
                      <div className="alert alert-danger py-3 d-flex align-items-center mb-4">
                        <i className="bi bi-exclamation-circle me-2 fs-5"></i>
                        <span className="fs-6">{error}</span>
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center mb-5">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="rememberMe"
                          style={{
                            transform: 'scale(1.2)',
                            marginRight: '8px'
                          }}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="rememberMe"
                          style={{ color: '#666', fontSize: '1rem' }}
                        >
                          Rester connecté
                        </label>
                      </div>
                      <a
                        href="#"
                        className="text-decoration-none fw-semibold"
                        style={{ color: '#161e38', fontSize: '1rem' }}
                      >
                        Mot de passe oublié ?
                      </a>
                    </div>

                    <div className="text-start mb-4 mt-3">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100 fw-bold py-3"
                        style={{
                          backgroundColor: '#102877',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '1.2rem',
                          color: '#fff',
                          padding: '12px 24px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 15px rgba(33, 32, 96, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#3a3a8c';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(33, 32, 96, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#102877';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(33, 32, 96, 0.3)';
                        }}
                      >
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Se connecter
                      </button>
                    </div>

                  </form>

                </div>
                {/* Footer - Left Aligned */}
                <div className="px-0 py-3 d-flex justify-content-between align-items-center mt-auto ">
                  <span
                    className="fw-semibold"
                    style={{ fontSize: '0.9rem' }}
                  >
                    © e-learning-platforme 2025
                  </span>
                  <div className="d-flex align-items-center gap-3">
                    <a
                      href="#"
                      className="text-decoration-none"
                      style={{ fontSize: '0.9rem', color: '#161e38' }}
                    >
                      Aide
                    </a>
                    <span style={{ fontSize: '0.9rem', color: '#161e38' }}>•</span>
                    <a
                      href="#"
                      className="text-decoration-none"
                      style={{ fontSize: '0.9rem', color: '#161e38' }}
                    >
                      À propos
                    </a>
                    <span style={{ fontSize: '0.9rem', color: '#161e38' }}>•</span>
                    <a
                      href="#"
                      className="text-decoration-none"
                      style={{ fontSize: '0.9rem', color: '#161e38' }}
                    >
                      Contact
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FirstPage;