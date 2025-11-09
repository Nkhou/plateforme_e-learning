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

interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  time_ago: string;
  related_course_title?: string;
  related_module_title?: string;
  related_content_title?: string;
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
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [showSearchCard, setShowSearchCard] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchCardRef = useRef<HTMLDivElement>(null);
  const [activeNavItem, setActiveNavItem] = useState('dashboard');

  // Notification states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

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
    setShowSearchCard(false);

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

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await api.get('notifications/');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.post(`notifications/${notificationId}/mark-read/`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('notifications/mark-all-read/');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Fetch notifications when notification dropdown opens
  useEffect(() => {
    if (isAuthenticated && openNotif) {
      fetchNotifications();
    }
  }, [openNotif, isAuthenticated]);

  // Group notifications by date
  const groupNotificationsByDate = () => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const groups: { [key: string]: Notification[] } = {
      'Aujourd\'hui': [],
      'Hier': [],
      'Plus ancien': []
    };

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.created_at).toDateString();

      if (notificationDate === today) {
        groups['Aujourd\'hui'].push(notification);
      } else if (notificationDate === yesterday) {
        groups['Hier'].push(notification);
      } else {
        groups['Plus ancien'].push(notification);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'course_activated':
        return '📚';
      case 'module_activated':
        return '📖';
      case 'content_activated':
        return '📄';
      case 'qcm_result':
        return '📝';
      case 'system':
        return '📢';
      case 'message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'course_activated':
        return '#c7d2fe'; // Light blue
      case 'module_activated':
        return '#bbf7d0'; // Light green
      case 'content_activated':
        return '#fef3c7'; // Light yellow
      case 'qcm_result':
        return '#fbcfe8'; // Light pink
      case 'system':
        return '#ddd6fe'; // Light purple
      case 'message':
        return '#bae6fd'; // Light cyan
      default:
        return '#e5e7eb'; // Light gray
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
        setUser(res.data.user);
        setLoading(false);

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
    setActiveNavItem(item);
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

  // Check if user is admin
  const isAdmin = user?.privilege === 'A' || user?.privilege === 'Admin';

  if (loading) return <div className="text-center p-5">Loading...</div>;
  if (!isAuthenticated) return <>{children}</>;

  const notificationGroups = groupNotificationsByDate();

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
            <SearchComponent
              onSearchResultClick={handleSearchResultClick}
              placeholder="Que cherchez-vous?"
              className="w-100"
              autoFocus={true}
            />
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
              {/* Logo Image */}
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

              {/* Mobile Search Icon - Positioned near notification icon */}
              <button
                className="btn btn-outline-light d-md-none me-2"
                onClick={handleSearchIconClick}
                style={{
                  width: '45px',
                  height: '45px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  backgroundColor: '#1e1b4b',
                  border: 'none',
                  padding: 0,
                  marginRight: '8px'
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
                    className="btn btn-outline-light dropdown-toggle position-relative"
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
                      border: 'none',
                      marginRight: '8px'
                    }}
                  >
                    🔔
                    {unreadCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-5px',
                          right: '-5px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          fontSize: '0.7rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold'
                        }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
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
                        borderTopRightRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <h6 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#1f2937' }}>
                          Notifications
                        </h6>
                        {notifications.length > 0 && unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#4338ca',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              borderRadius: '4px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d1d5db'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            Tout marquer comme lu
                          </button>
                        )}
                      </div>

                      <div style={{ padding: '0.5rem' }}>
                        {loadingNotifications ? (
                          <div style={{
                            padding: '2rem',
                            textAlign: 'center',
                            color: '#6b7280'
                          }}>
                            Chargement des notifications...
                          </div>
                        ) : notifications.length === 0 ? (
                          <div style={{
                            padding: '3rem 2rem',
                            textAlign: 'center',
                            color: '#6b7280'
                          }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
                            <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                              Aucune notification
                            </div>
                            <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                              Vous serez notifié quand de nouveaux contenus seront disponibles
                            </div>
                          </div>
                        ) : (
                          Object.entries(notificationGroups).map(([groupName, groupNotifications]) => (
                            <div key={groupName}>
                              <div style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: '#6b7280',
                                textTransform: 'uppercase'
                              }}>
                                {groupName}
                              </div>

                              {groupNotifications.map((notification) => (
                                <div
                                  key={notification.id}
                                  style={{
                                    display: 'flex',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    backgroundColor: notification.is_read ? 'white' : '#f0f4ff',
                                    borderRadius: '8px',
                                    marginBottom: '0.5rem',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    borderLeft: notification.is_read ? 'none' : '3px solid #4338ca'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = notification.is_read ? '#f3f4f6' : '#e0e7ff'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.is_read ? 'white' : '#f0f4ff'}
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    backgroundColor: getNotificationColor(notification.notification_type),
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.2rem'
                                  }}>
                                    {getNotificationIcon(notification.notification_type)}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                      fontSize: '0.875rem',
                                      color: '#1f2937',
                                      marginBottom: '0.25rem',
                                      fontWeight: notification.is_read ? '400' : '600'
                                    }}>
                                      {notification.title}
                                    </div>
                                    <div style={{
                                      fontSize: '0.8rem',
                                      color: '#6b7280',
                                      lineHeight: '1.4'
                                    }}>
                                      {notification.message}
                                    </div>
                                    <div style={{
                                      fontSize: '0.7rem',
                                      color: '#9ca3af',
                                      marginTop: '0.25rem'
                                    }}>
                                      • {notification.time_ago}
                                    </div>
                                  </div>
                                  {!notification.is_read && (
                                    <div style={{
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      backgroundColor: '#4338ca',
                                      flexShrink: 0,
                                      marginTop: '4px'
                                    }}></div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))
                        )}
                      </div>

                      {notifications.length > 0 && (
                        <div style={{
                          padding: '1rem',
                          borderTop: '1px solid #d1d5db',
                          backgroundColor: '#e8eaf6',
                          borderBottomLeftRadius: '12px',
                          borderBottomRightRadius: '12px',
                          textAlign: 'center'
                        }}>
                          <a href="/notifications" style={{
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
                      )}
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
            {/* Only show Dashboard for admin users */}
            {isAdmin && (
              <NavButton active={activeNavItem === 'dashboard'} onClick={() => handleNavigation('dashboard')} icon="" label="Dashboard" />
            )}

            <NavButton active={activeNavItem === 'formations'} onClick={() => handleNavigation('formations')} icon="" label="Formations" />

            {/* Only show Utilisateurs for admin users */}
            {isAdmin && (
              <NavButton active={activeNavItem === 'utilisateurs'} onClick={() => handleNavigation('utilisateurs')} icon="" label="Utilisateurs" />
            )}

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