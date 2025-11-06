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

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      backgroundColor: active ? '#4338CA' : 'transparent',
      color: active ? 'white' : '#A0AEC0',
      border: 'none',
      padding: '0.5rem 0.875rem',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
      flexShrink: 0
    }}
  >
    <span style={{ fontSize: '1rem' }}>{icon}</span>
    {label}
  </button>
);

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
  const [activeNavItem, setActiveNavItem] = useState('dashboard');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setOpen(false);
        setOpenNotif(false);
      }
      
      // Don't close if clicking inside the search card (including buttons)
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

  const handleNavigation = (item: string) => {
    // update active nav item
    setActiveNavItem(item);

    // read privilege from current user state
    const privilege = user?.privilege;

    switch (item) {
      case 'dashboard':
        if (privilege === 'A' || privilege === 'Admin') {
          navigate('/admin');
        } else if (privilege === 'F') {
          navigate('/cours');
        } else {
          navigate('/dashboard');
        }
        break;
      case 'formations':
        if (privilege === 'A' || privilege === 'Admin') {
          navigate('/formations');
        } else if (privilege === 'F') {
          navigate('/formations');
        } else {
          navigate('/dashboard');
        }
        break;
      case 'utilisateurs':
        if (privilege === 'A' || privilege === 'Admin') {
          navigate('/utilisateurs');
        }
        break;
      case 'messages':
        navigate('/messages');
        break;
      case 'favoris':
        if (privilege === 'AP') {
          console.log('99999999999999999999999999999999444444444444444444444444')
          navigate('/favoris');
        }
        break;
      default:
        navigate('/dashboard');
        break;
    }
  };

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
            className="card position-absolute translate-middle"
            style={{
              width: '90%',
              maxWidth: '600px',
              maxHeight: '80vh',
              zIndex: 1050,
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: 'none',
              borderRadius: '12px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="card-body p-3 p-md-4">
              <SearchComponent
                onSearchResultClick={handleSearchResultClick}
                placeholder="Que cherchez-vous?"
                className="w-100"
                autoFocus={true}
              />
              <div className="text-muted mt-3">
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Top Navbar */}
        <nav
          className="navbar navbar-light border-bottom px-2 px-md-3"
          style={{ background: 'rgba(5, 44, 101, 0.9)' }}
        >
          <div className="container-fluid">
            <div className="d-flex align-items-center w-100">
              {/* Logo Image - Always visible */}
              <img
                src="/logo-colored.png"
                alt="Logo"
                style={{
                  width: '40px',
                  height: '40px',
                  objectFit: 'contain',
                  marginRight: '0.75rem'
                }}
              />

              {/* Search Bar - Hidden on small screens, visible on md+ */}
              <div
                className="search-bar-container position-relative d-none d-md-block"
                style={{
                  maxWidth: '250px',
                  minWidth: '200px',
                  marginRight: 'auto'
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
                  <span style={{ color: '#6c757d', fontWeight: '400', fontSize: '0.875rem' }}>
                    Que cherchez-vous?
                  </span>

                  <div
                    style={{
                      width: '1px',
                      height: '24px',
                      backgroundColor: '#ced4da',
                      marginLeft: '8px',
                      marginRight: '8px'
                    }}
                  ></div>
                  <button
                    type="button"
                    className="btn bg-gray-100 text-black px-2 py-1 rounded"
                    style={{
                      border: 'none',
                      fontSize: '0.875rem'
                    }}
                  >
                    🔎︎
                  </button>
                </div>
              </div>

              {/* Mobile Search Icon - Visible only on small screens */}
              <button
                className="btn btn-outline-light d-md-none ms-auto me-2"
                onClick={handleSearchIconClick}
                style={{
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  backgroundColor: '#1e1b4b',
                  border: 'none',
                  padding: 0
                }}
                aria-label="Search"
              >
                🔍
              </button>

              <div className="btn-group custom-dropdown-group ms-auto ms-md-0" ref={dropdownRef}>
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
                      borderRadius: '6px',
                      backgroundColor: '#1e1b4b',
                      border: 'none'
                    }}
                  >
                    🔔
                  </button>
                  {openNotif && (
                    <div className="dropdown-menu show mt-2" style={{
                      minWidth: '380px',
                      maxWidth: '95vw',
                      maxHeight: '70vh',
                      overflowY: 'auto',
                      backgroundColor: '#e8eaf6',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      padding: '0',
                      right: '0',
                      left: 'auto'
                    }}>
                      <div style={{
                        padding: '1rem 1.5rem',
                        borderBottom: '1px solid #d1d5db',
                        backgroundColor: '#e8eaf6',
                        borderTopLeftRadius: '12px',
                        borderTopRightRadius: '12px'
                      }}>
                        <h6 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#1f2937' }}>
                          Notifications
                        </h6>
                      </div>
                      
                      <div style={{ padding: '0.5rem' }}>
                        <div style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase'
                        }}>
                          Aujourd'hui
                        </div>
                        
                        {/* Notification Item */}
                        <div style={{
                          display: 'flex',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          marginBottom: '0.5rem',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            backgroundColor: '#c7d2fe',
                            flexShrink: 0
                          }}></div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.875rem', color: '#1f2937', marginBottom: '0.25rem' }}>
                              <strong>Nouveau module disponible</strong> "titre du module" par [nom formateur]
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              • Il y a 2 heures
                            </div>
                          </div>
                        </div>

                        <div style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          marginTop: '0.5rem'
                        }}>
                          11 Octobre, 2025
                        </div>

                        {/* More Notification Items */}
                        <div style={{
                          display: 'flex',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          marginBottom: '0.5rem',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            backgroundColor: '#c7d2fe',
                            flexShrink: 0
                          }}></div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.875rem', color: '#1f2937', marginBottom: '0.25rem' }}>
                              <strong>Jean dupont</strong> a terminer la lecture du module [titre du module]
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              • Il y a 2 heures
                            </div>
                          </div>
                        </div>

                        <div style={{
                          display: 'flex',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          marginBottom: '0.5rem',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            backgroundColor: '#c7d2fe',
                            flexShrink: 0
                          }}></div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.875rem', color: '#1f2937', marginBottom: '0.25rem' }}>
                              <strong>Nouveau module disponible</strong> "titre du module" par [nom formateur]
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              • Il y a 2 heures
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{
                        padding: '1rem',
                        borderTop: '1px solid #d1d5db',
                        backgroundColor: '#e8eaf6',
                        borderBottomLeftRadius: '12px',
                        borderBottomRightRadius: '12px',
                        textAlign: 'center'
                      }}>
                        <a href="#" style={{
                          color: '#4338ca',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                          Voir toutes les notifications
                        </a>
                      </div>
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
                      borderRadius: '6px',
                      backgroundColor: '#1e1b4b',
                      border: 'none'
                    }}
                  >
                    👤
                  </button>
                  {open && (
                    <div className="dropdown-menu show mt-2" style={{
                      minWidth: '280px',
                      maxWidth: '95vw',
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      padding: '0.5rem',
                      right: '0',
                      left: 'auto'
                    }}>
                      <div style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #e5e7eb',
                        marginBottom: '0.5rem'
                      }}>
                        <h6 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                          Mon compte
                        </h6>
                      </div>
                      
                      <a href="#" style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        color: '#374151',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        Mon compte
                      </a>
                      
                      <a href="#" style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        color: '#374151',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        Paramètres
                      </a>

                      <div style={{
                        borderTop: '1px solid #e5e7eb',
                        margin: '0.5rem 0'
                      }}></div>

                      <button
                        onClick={handleLogOut}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '0.75rem 1rem',
                          color: '#dc2626',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          transition: 'background-color 0.2s',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        Se déconnecter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Bottom Navigation Bar */}
        <nav style={{ 
          backgroundColor: '#12114a', 
          padding: '0.80rem 1rem', 
          borderBottom: '1px solid rgba(255,255,255,0.1)', 
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.3) transparent'
        }}>
          <style>
            {`
              nav::-webkit-scrollbar {
                height: 4px;
              }
              nav::-webkit-scrollbar-track {
                background: transparent;
              }
              nav::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.3);
                border-radius: 2px;
              }
              nav::-webkit-scrollbar-thumb:hover {
                background: rgba(255,255,255,0.5);
              }
            `}
          </style>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            maxWidth: '1400px', 
            margin: '0 auto', 
            minWidth: 'max-content',
            paddingLeft: '0.5rem',
            paddingRight: '0.5rem'
          }}>
            <NavButton active={activeNavItem === 'dashboard'} onClick={() => handleNavigation('dashboard')} icon="" label="Dashboard" />
            <NavButton active={activeNavItem === 'formations'} onClick={() => handleNavigation('formations')} icon="" label="Formations" />
            <NavButton active={activeNavItem === 'utilisateurs'} onClick={() => handleNavigation('utilisateurs')} icon="" label="Utilisateurs" />
            <NavButton active={activeNavItem === 'messages'} onClick={() => handleNavigation('messages')} icon="" label="Messages" />
            <NavButton active={activeNavItem === 'favoris'} onClick={() => handleNavigation('favoris')} icon="" label="Favoris" />
          </div>
        </nav>

        {/* Page Content */}
        <div className="flex-grow-1" style={{ background: '#f8f9fa' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthGuard;