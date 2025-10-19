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
  const [openNotif, setOpenNotif] = useState(false);
  const [showSearchCard, setShowSearchCard] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setOpen(false);
        setOpenNotif(false);
      }
      if (searchCardRef.current && !searchCardRef.current.contains(target) &&
        !(target as Element).closest('.search-bar')) {
        setShowSearchCard(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close search card when pressing Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSearchCard(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleMenu = () => {
    setOpen((prev) => !prev);
    setOpenNotif(false);
  };

  const handleNotif = () => {
    setOpenNotif((prev) => !prev);
    setOpen(false);
  };

  const handleSearchIconClick = () => {
    setShowSearchCard(true);
  };

  const handleSearchResultClick = (result: SearchResult) => {
    console.log('Selected result:', result);
    // Close search card when result is selected
    setShowSearchCard(false);

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
    const checkAuthentication = async () => {
      try {
        const res = await api.get('CheckAuthentification/', {
          withCredentials: true,
        });

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
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
        setLoading(false);
        if (location.pathname !== '/') {
          navigate('/');
        }
      }
    };

    checkAuthentication();
  }, [navigate, location]);

  const handleLogOut = async () => {
    try {
      await api.post('logout/', {}, {
        withCredentials: true,
      });
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/');
    }
  };

  if (loading) return <div className="text-center p-5">Loading...</div>;
  if (!isAuthenticated) return <>{children}</>;

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Search Overlay Card */}
      {showSearchCard && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{
            zIndex: 1040,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            ref={searchCardRef}
            className="card position-absolute top-50 start-50 translate-middle"
            style={{
              width: '90%',
              maxWidth: '600px',
              maxHeight: '80vh',
              zIndex: 1050,
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: 'none',
              borderRadius: '12px'
            }}
          >
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center"
              style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
              <h5 className="mb-0">
                <i className="fas fa-search me-2"></i>
                Recherche
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowSearchCard(false)}
                aria-label="Close"
              ></button>
            </div>
            <div className="card-body p-4">
              <SearchComponent
                onSearchResultClick={handleSearchResultClick}
                placeholder="Que cherchez-vous?"
                className="w-100"
              // autoFocus={true}
              />
              <div className="text-muted mt-3">
                <small>
                  <i className="fas fa-info-circle me-1"></i>
                  Recherchez parmi vos cours, modules et contenus. Appuyez sur Échap pour fermer.
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

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
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? '×' : '☰'}
              </button>

              {!sidebarOpen && (
                <div className="d-flex align-items-center justify-content-between w-100">
                  {/* Left Side: Logo + Search Bar */}
                  <div className="d-flex align-items-center justify-content-between w-100">
                    {/* Left Side: Logo + Search Bar */}
                    <div className="d-flex align-items-center gap-3">
                      {/* Logo Image */}
                      <img
                        src="/logo-colored.png"
                        alt="Logo"
                        style={{
                          width: '40px',
                          height: '40px',
                          objectFit: 'contain',
                        }}
                      />

                      {/* Search Bar */}
                      <div
                        className="search-bar-container position-relative"
                        style={{
                          maxWidth: '250px',
                          minWidth: '200px',
                        }}
                      >
                        <div
                          className="search-bar d-flex align-items-center"
                          onClick={handleSearchIconClick}
                          style={{
                            background: 'white',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            height: '40px'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#f8f9fa';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                          }}
                        >
                          <i className="fas fa-search me-2" style={{ color: '#6c757d' }}></i>
                          <span style={{ color: '#6c757d', fontWeight: '400' }}>
                            Que cherchez-vous?
                          </span>

                          <div
                            style={{
                              width: '1px',
                              height: '24px',
                              backgroundColor: '#ced4da',
                              marginRight: '2px'
                            }}
                          ></div>
                          <button
                            type="button"
                            className="btn bg-gray-100 text-black px-2 py-1 rounded "
                            style={{
                              // backgroundColor: '#d3d3d3', // light gray
                              border: 'none'
                            }}
                          >
                            🔎︎
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="btn-group custom-dropdown-group" ref={dropdownRef}>
                    {/* Notifications Dropdown */}
                    <div className="dropdown me-2">
                      <button
                        type="button"
                        className="btn btn-outline-light dropdown-toggle"
                        onClick={handleNotif}
                        aria-expanded={openNotif}
                        aria-label="Notifications"
                        style={{
                          width: '45px',
                          height: '45px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px'
                        }}
                      >
                        🔔
                      </button>
                      {openNotif && (
                        <div className="dropdown-menu show custom-dark-dropdown mt-2">
                          <h6 className="dropdown-header custom-header">Hello, {user?.username}</h6>
                          <a className="dropdown-item custom-item" href="#">cours</a>
                        </div>
                      )}
                    </div>

                    {/* User Menu Dropdown */}
                    <div className="dropdown">
                      <button
                        type="button"
                        className="btn btn-outline-light dropdown-toggle"
                        onClick={handleMenu}
                        aria-expanded={open}
                        aria-label="User menu"
                        style={{
                          width: '45px',
                          height: '45px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px'
                        }}
                      >
                        👤
                      </button>
                      {open && (
                        <div className="dropdown-menu show custom-dark-dropdown mt-2">
                          <h6 className="dropdown-header custom-header">Hello, {user?.username}</h6>
                          <a className="dropdown-item custom-item" href="#">Profile</a>
                          <a className="dropdown-item custom-item" href="#">Settings</a>
                          <div className="dropdown-divider custom-divider"></div>
                          <button
                            className="dropdown-item custom-item"
                            onClick={handleLogOut}
                            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                          >
                            Log out
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className="flex-grow-1 p-3" style={{ background: '#f8f9fa' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthGuard;