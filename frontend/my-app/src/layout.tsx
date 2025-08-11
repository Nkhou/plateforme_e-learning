// AuthGuard.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';


interface AuthGuardProps {
  children: React.ReactNode;
}

export interface User {
  username: string;
  firstname: string;
  lastName: string;
  email: string;
  Privilege: string;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    axios.get('http://localhost:8000/api/CheckAuthentification/', {
      withCredentials: true,
    })
    .then(res => {
      const auth = res.data.authenticated;
      setIsAuthenticated(auth);
      console.log('data:  ', res.data.user);
      setUser(res.data.user);
      setLoading(false);

      if (!auth && location.pathname !== '/') {
        navigate('/');
      } else if (auth && location.pathname === '/') {
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
    <div className="d-flex " style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className={`border-end ${sidebarOpen ? 'd-block' : 'd-none'} d-md-block`} style={{ width: '250px', minHeight: '100vh', backgroundColor: '#002155' }}>
        <div className="p-3 ">
          <h5>Your Brand</h5>
          <ul className="nav flex-column">
            <li className="nav-item">
              <a href="/dashboard" className="nav-link"><img src="/dashboard.svg" alt="Dashboard" width="16" height="16" /> Dashboard</a>
            </li>
            <li className="nav-item">
              <a href="/profile" className="nav-link"><img src="/profile.svg" alt="Dashboard" width="16" height="16" /> Profile</a>
            </li>
            <li className="nav-item">
              <a href="/settings/general" className="nav-link"><img src="/settings.svg" alt="Dashboard" width="16" height="16" /> General Settings</a>
            </li>
            <li className="nav-item">
              <a href="/settings/security" className="nav-link"><img src="/security.svg" alt="Dashboard" width="16" height="16" /> Security</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1">
        {/* Top Navbar / Toggle button */}
        <nav className="navbar navbar-light bg-white border-bottom px-3">
          <button
            className="btn btn-outline-primary d-md-none"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '×' : '☰'}
            </button>
            
          <span className="ms-auto">Hello, {user?.username}</span>
        </nav>

        <div className="p-3">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthGuard;
