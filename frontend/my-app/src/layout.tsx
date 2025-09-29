
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from './api/api';

interface AuthGuardProps {
  children: React.ReactNode;
}

export interface User {
  username: string;
  firstname: string;
  lastName: string;
  email: string;
  privilege: string;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api.get('CheckAuthentification/', { // Use your configured api instance
      withCredentials: true,
    })
      .then(res => {
        const auth = res.data.authenticated;
        setIsAuthenticated(auth);
        console.log('data: ', res.data.user);
        setUser(res.data.user);
        setLoading(false);
        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++", user?.username, user?.privilege, location.pathname)
        if (!auth && location.pathname !== '/') {
          navigate('/');
        }
        else if (auth && location.pathname === '/' && (user?.privilege === 'A' || user?.privilege === 'Admin')) {
          navigate('/admin');
        }
        else if (auth && location.pathname === '/' && (user?.privilege === 'F' )) {
          navigate('/cours');
        }
        else if (auth && location.pathname === '/') {

          navigate('/dashboard');
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setLoading(false);
        if (location.pathname !== '/') {
          navigate('/');
        }
      });
  }, [navigate, location]);

  if (loading) return <div className="text-center p-5">Loading...</div>;
  if (!isAuthenticated) return <>{children}</>;

  return (
    <>

      <div className="d-flex" style={{ minHeight: '100vh' }}>
        {/* Sidebar */}
        <div className={`border-end ${sidebarOpen ? 'd-block' : 'd-none'} d-md-block`} style={{ width: '260px', minHeight: '100vh', background: 'rgba(5, 44, 101, 0.9)' }}>
          <div className="p-3">
            <h5 className="text-white">platform</h5>
            <ul className="nav flex-column">
              {user?.privilege !== 'A' && (
                <>
                {user?.privilege !== 'F' && (
                  <li className="nav-item">
                    <a href="/dashboard" className="nav-link text-white">
                      <img src="/dashboard.svg" alt="Dashboard" width="16" height="16" /> Dashboard
                    </a>
                  </li>
                )}
                  {user?.privilege === 'F' && (
                    <li className="nav-item">
                      <a href="/cours" className="nav-link text-white">
                        <img src="/save-icon.svg" alt="Register" width="16" height="16" /> Save Courses
                      </a>
                    </li>
                  )}
                </>
              )}

              {(user?.privilege === 'A' || user?.privilege === 'Admin') && (
                <>
                  <li className="nav-item">
                    <a href="/admin" className="nav-link text-white">
                      <img src="/dashboard.svg" alt="Dashboard" width="16" height="16" /> Dashboard
                    </a>
                  </li>
                  <li className="nav-item">
                    <a href="/signup" className="nav-link text-white">
                      <img src="/add-user.svg" alt="Dashboard" width="16" height="16" /> create new user
                    </a>
                  </li>
                </>
              )
              }
              <li className="nav-item">
                <a href="/profile" className="nav-link text-white">
                  <img src="/profile.svg" alt="Profile" width="16" height="16" /> Profile
                </a>
              </li>
              <li className="nav-item">
                <a href="/settings/general" className="nav-link text-white">
                  <img src="/settings.svg" alt="Settings" width="16" height="16" /> General Settings
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1">
          {/* Top Navbar */}
          <nav className="navbar navbar-light  border-bottom px-3 d-flex align-items-center" style={{ background: 'rgba(5, 44, 101, 0.9)' }}>
            <div className="d-flex align-items-center">
              <button
                className="btn btn-outline-primary d-md-none me-3"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? '×' : '☰'}
              </button>
            </div>
            {!sidebarOpen && (
              <div className="d-flex align-items-center justify-content-between flex-grow-1">
                <form className="search-form">
                  <input type="search" placeholder="Search here" className="search-input" />
                  <i className="fa fa-search search-icon"></i>
                </form>

                <span style={{ color: 'white' }}>Hello, {user?.username}</span>
              </div>
            )}
          </nav>
          {!sidebarOpen && (

            <div className="p-3">
              {children}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AuthGuard;