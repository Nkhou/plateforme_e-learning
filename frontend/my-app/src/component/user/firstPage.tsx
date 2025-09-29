import React, { useEffect } from 'react';
import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
// import  type {User} from '../../layout';
import api from '../../api/api';
export interface User {
  id: number
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
      } else if (user.privilege === 'F') {
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
      if ((user?.privilege === 'A' || user?.privilege === 'Admin')) {
        navigate('/admin/');
      }
      else {
        navigate('/dashboard/');
      }

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
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}
  >
    <div className="flex-grow-1 container-fluid h-100">
      <div className="row h-100 g-0">
        
        {/* IMAGE SECTION - Full Height with spacing */}
        

        {/* LOGIN SECTION - Full Height with spacing */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center h-100 p-0">
          <div
            className="card shadow-lg p-4 p-md-5 rounded-3 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{
              background: '#212060',
              border: 'none',
              backdropFilter: 'blur(10px)',
              minHeight: '98vh',
              top: 8
            }}
          >
            <div className="card-body d-flex flex-column justify-content-center w-100" style={{ 
              maxWidth: '500px',
              paddingTop: '2rem',
              paddingBottom: '2rem'
            }}>
              <div className="text-center mb-5">
                <img
                  src="/login-icon.png"
                  alt="Login"
                  style={{
                    width: '100px',
                    height: '100px',
                    marginBottom: '30px'
                  }}
                />
                <h2
                  className="fw-bold mb-3"
                  style={{ fontSize: '2.2rem', color: '#fff' }}
                >
                  Accéder à votre compte
                </h2>
                <h4
                  className="fs-6 mb-4"
                  style={{ fontSize: '1.3rem', color: '#fff', opacity: 0.9 }}
                >
                  Entrez vos informations de connexion ci-dessous
                </h4>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="w-100">
                <div className="mb-4">
                  <label
                    htmlFor="email"
                    className="form-label fw-semibold fs-5"
                    style={{ color: '#fff' }}
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
                    style={{
                      background: '#f8f9fa',
                      border: '1px solid #ced4da',
                      borderRadius: '10px',
                      fontSize: '1.1rem',
                      padding: '12px 16px'
                    }}
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="password"
                    className="form-label fw-semibold fs-5"
                    style={{ color: '#fff' }}
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
                    style={{
                      background: '#f8f9fa',
                      border: '1px solid #ced4da',
                      borderRadius: '10px',
                      fontSize: '1.1rem',
                      padding: '12px 16px'
                    }}
                  />
                  {error && (
                    <div className="alert alert-danger mt-3 py-3 d-flex align-items-center">
                      <i className="bi bi-exclamation-circle me-2 fs-5"></i>
                      <span className="fs-6">{error}</span>
                    </div>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="rememberMe"
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <label
                      className="form-check-label ms-2"
                      htmlFor="rememberMe"
                      style={{ color: '#b0b0e1', fontSize: '1rem' }}
                    >
                      Rester connecté
                    </label>
                  </div>
                  <a
                    href="#"
                    className="text-decoration-none fw-semibold"
                    style={{ color: '#b0b0e1', fontSize: '1rem' }}
                  >
                    Mot de passe oublié ?
                  </a>
                </div>

                <div className="text-center mb-3">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 fw-bold py-3"
                    style={{
                      backgroundColor: '#dddde7',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '1.2rem',
                      color: '#131313',
                      padding: '12px 24px'
                    }}
                  >
                    <i
                      className="bi bi-box-arrow-in-right me-2"
                    ></i>
                    Se connecter
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>


<div className="col-lg-6 d-flex flex-column h-100 p-0">
          {/* Image area - With top and bottom spacing */}
          <div className="flex-grow-1 d-flex justify-content-center align-items-center px-4 pt-4 pb-2" style={{ minHeight: 'calc(100vh - 80px)' }}>
            <img
              src="/Wavy_Edu-01_Single-04.jpg"
              alt="Wavy Education"
              className="rounded w-100 h-100"
              style={{
                objectFit: 'cover',
                maxHeight: '100%'
              }}
            />
          </div>

          {/* Footer */}
          <div className="px-4 py-3 d-flex justify-content-between align-items-center" style={{ minHeight: '80px' }}>
            <span
              className="fw-semibold"
              style={{ fontSize: '0.9rem', color: '#131313' }}
            >
              © e-learning-platforme 2025
            </span>
            <div className="d-flex align-items-center gap-3">
              <a
                href="#"
                className="text-decoration-none"
                style={{ fontSize: '0.9rem', color: '#131313' }}
              >
                Aide
              </a>
              <span style={{ fontSize: '0.9rem', color: '#131313' }}>•</span>
              <a
                href="#"
                className="text-decoration-none"
                style={{ fontSize: '0.9rem', color: '#131313' }}
              >
                À propos
              </a>
              <span style={{ fontSize: '0.9rem', color: '#131313' }}>•</span>
              <a
                href="#"
                className="text-decoration-none"
                style={{ fontSize: '0.9rem', color: '#131313' }}
              >
                Contact
              </a>
            </div>
          </div>
        </div>






      </div>
    </div>
  </div>
);

}

export default FirstPage;