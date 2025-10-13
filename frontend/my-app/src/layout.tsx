import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from './api/api';
import SearchComponent from '../src/component/Search/SearchComponent';

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

interface SearchResult {
  id: number;
  type: 'course' | 'module' | 'content';
  title: string;
  description?: string;
  course_title?: string;
  module_title?: string;
  content_type?: string;
  creator?: string;
  status?: number;
  status_display?: string;
  course_id?: number;
  module_id?: number;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleMenu = () => {
    setOpen((prev) => !prev)
  }
  const handleSearchResultClick = (result: SearchResult) => {
    console.log('Selected result:', result);
    // Custom logic based on result type
    switch (result.type) {
      case 'course':
        navigate(`/cours/${result.id}`);
        break;
      case 'module':
        if (result.course_id) {
          navigate(`/cours/${result.course_id}`);
        } else {
          console.warn('Module result missing course_id:', result);
        }
        break;
      case 'content':
        if (result.course_id && result.module_id) {
          navigate(`/cours/${result.course_id}`);
        } else {
          console.warn('Content result missing course_id or module_id:', result);
        }
        break;
      default:
        console.warn('Unknown result type:', result.type);
    }
  };

  useEffect(() => {
    api.get('CheckAuthentification/', {
      withCredentials: true,
    })
      .then(res => {
        const auth = res.data.authenticated;
        setIsAuthenticated(auth);
        console.log('data: ', res.data.user);
        setUser(res.data.user);
        setLoading(false);

        console.log("User privilege:", res.data.user?.privilege, "Current path:", location.pathname);

        if (!auth && location.pathname !== '/') {
          navigate('/');
        } else if (auth && location.pathname === '/') {
          const privilege = res.data.user?.privilege;
          if (privilege === 'A' || privilege === 'Admin') {
            navigate('/admin');
          } else if (privilege === 'F') {
            navigate('/cours');
          } else {
            navigate('/dashboard');
          }
        }
      })
      .catch((error) => {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
        setLoading(false);
        if (location.pathname !== '/') {
          navigate('/');
        }
      });
  }, [navigate, location]);
  const handleLogOut =() => {
    api.post('logout/', {
      withCredentials: true,
    })
      .then(res => {
        console.log('res', res);
        navigate('/');
      })
      .catch((error) => {
      
          navigate('/');
      });
  }
  if (loading) return <div className="text-center p-5">Loading...</div>;
  if (!isAuthenticated) return <>{children}</>;

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <div
        className={`border-end ${sidebarOpen ? 'd-block' : 'd-none'} d-md-block`}
        style={{
          width: '260px',
          minHeight: '100vh',
          background: 'rgba(5, 44, 101, 0.9)',
          position: 'sticky',
          top: 0
        }}
      >
        <div className="p-3">
          <h5 className="text-white mb-4">Platform</h5>
          <ul className="nav flex-column">
            {(user?.privilege === 'A' || user?.privilege === 'Admin') && (
              <>
                <li className="nav-item mb-2">
                  <a href="/admin" className="nav-link text-white d-flex align-items-center">
                    <img src="/dashboard.svg" alt="Dashboard" width="16" height="16" className="me-2" />
                    Dashboard admin
                  </a>
                </li>
                <li className="nav-item mb-2">
                  <a href="/signup" className="nav-link text-white d-flex align-items-center">
                    <img src="/add-user.svg" alt="Create User" width="16" height="16" className="me-2" />
                    Create new user
                  </a>
                </li>
              </>
            )}
            {user?.privilege !== 'A' && (
              <>
                {user?.privilege !== 'F' && (
                  <li className="nav-item mb-2">
                    <a href="/dashboard" className="nav-link text-white d-flex align-items-center">
                      <img src="/dashboard.svg" alt="Dashboard" width="16" height="16" className="me-2" />
                      Dashboard
                    </a>
                  </li>
                )}
                {user?.privilege === 'F' && (
                  <li className="nav-item mb-2">
                    <a href="/cours" className="nav-link text-white d-flex align-items-center">
                      <img src="/save-icon.svg" alt="Courses" width="16" height="16" className="me-2" />
                      My Courses
                    </a>
                  </li>
                )}
              </>
            )}
            <li className="nav-item mb-2">
              <a href="/profile" className="nav-link text-white d-flex align-items-center">
                <img src="/profile.svg" alt="Profile" width="16" height="16" className="me-2" />
                Profile
              </a>
            </li>
            <li className="nav-item mb-2">
              <a href="/settings/general" className="nav-link text-white d-flex align-items-center">
                <img src="/settings.svg" alt="Settings" width="16" height="16" className="me-2" />
                General Settings
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Top Navbar */}
        <nav
          className="navbar navbar-light border-bottom px-3"
          style={{ background: 'rgba(5, 44, 101, 0.9)' }}
        >
          <div className="container-fluid">
            <div className="d-flex align-items-center w-100">
              <button
                className="btn btn-outline-light d-md-none me-3"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ borderColor: 'rgba(255,255,255,0.5)' }}
              >
                {sidebarOpen ? '×' : '☰'}
              </button>

              {!sidebarOpen && (
                <div className="d-flex align-items-center justify-content-between w-100">
                  {/* Search Form - Styled like your original */}
                  <form className="search-form position-relative flex-grow-1 me-4" style={{ maxWidth: '500px' }}>
                    <SearchComponent
                      onSearchResultClick={handleSearchResultClick}
                      placeholder="Search courses, modules, or content..."
                      className="w-100"
                    />
                  </form>



                  <div className="btn-group custom-dropdown-group" ref={dropdownRef}>
                    <button
                      type="button"
                      className="btn btn-info dropdown-toggle rounded-btn"
                      onClick={() => handleMenu()}
                      aria-expanded={open}
                    >
                    </button>
                    {open && (
                      <div className="dropdown-menu show custom-dark-dropdown ">
                        <h6 className="dropdown-header custom-header">Hello, {user?.username}</h6>
                        <a className="dropdown-item custom-item" href="#">Profile</a>
                        <a className="dropdown-item custom-item" href="#">Settings</a>
                        <div className="dropdown-divider custom-divider"></div>
                        <a className="dropdown-item custom-item" onClick={() => handleLogOut()}>Log out</a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Page Content */}
        {!sidebarOpen && (
          <div className="flex-grow-1 p-3" style={{ background: '#f8f9fa' }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthGuard;