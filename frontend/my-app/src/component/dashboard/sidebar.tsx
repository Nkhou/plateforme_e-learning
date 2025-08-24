import type { ReactNode } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CBadge,
  CSidebar,
  CSidebarBrand,
  CSidebarHeader,
  CSidebarNav,
  CNavGroup,
  CNavItem,
  CNavTitle,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilLayers, cilPuzzle, cilSpeedometer, cilMenu } from '@coreui/icons'

interface AuthGuardProps {
  children: ReactNode;
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
  const [sidebarShow, setSidebarShow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [sidebarKey, setSidebarKey] = useState(0); // Force sidebar re-mount
  const navigate = useNavigate();
  const location = useLocation();
  // const [user, setUser] = useState<User | null>(null);

  // Enhanced responsive breakpoint detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;
      const desktop = width >= 1024;
      
      setIsMobile(prevMobile => {
        // Force sidebar re-mount when switching between mobile and desktop
        if (prevMobile !== mobile) {
          setSidebarKey(prev => prev + 1);
        }
        return mobile;
      });
      
      setIsTablet(tablet);
      
      // Auto-hide sidebar on mobile, show on desktop
      setSidebarShow(prevShow => {
        if (mobile) {
          return false;
        } else if (desktop) {
          return true;
        }
        // Keep current state for tablet
        return prevShow;
      });
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    axios.get('http://localhost:8000/api/CheckAuthentification/', { withCredentials: true })
      .then(res => {
        console.log('res.data', res.data);
        const authenticated = res.data.authenticated;
        // setUser(res.data.user)
        setIsAuthenticated(authenticated);
        setLoading(false);
        if (!authenticated && location.pathname !== '/') {
          navigate('/');
        }
        if (authenticated && location.pathname === '/') {
          navigate('/dashboard');
        }
      })
      .catch(() => {
        console.log('Authentication check failed');
        setLoading(false);
        setIsAuthenticated(false);
        if (location.pathname !== '/') {
          navigate('/');
        }
      });
  }, [navigate, location]);

  const toggleSidebar = useCallback(() => {
    setSidebarShow(prev => !prev);
  }, []);

  const closeSidebarOnMobile = useCallback(() => {
    if (isMobile || isTablet) {
      setSidebarShow(false);
    }
  }, [isMobile, isTablet]);

  if (loading) return <div className="loading-container">Loading...</div>;

  // Render sidebar only for authenticated users with protected content
  if (isAuthenticated) {
    return (
      <div className="app-container">
        {/* Mobile menu button - show only when sidebar is hidden */}
        {(isMobile || isTablet) && !sidebarShow && (
          <button
            className="mobile-menu-btn"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
            style={{
              position: 'fixed',
              top: '1rem',
              left: '1rem',
              zIndex: 1050,
              background: '#fff',
              border: '1px solid #dee2e6',
              borderRadius: '0.375rem',
              padding: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <CIcon icon={cilMenu} />
          </button>
        )}

        {/* Sidebar overlay for mobile/tablet */}
        {(isMobile || isTablet) && sidebarShow && (
          <div 
            className="sidebar-overlay" 
            onClick={closeSidebarOnMobile}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1040
            }}
          />
        )}

        <CSidebar
          key={sidebarKey} // Force re-mount when switching modes
          className={`sidebar-responsive ${sidebarShow ? 'sidebar-show' : ''}`}
          position="fixed"
          unfoldable={!isMobile && !isTablet}
          visible={sidebarShow}
          // REMOVED: onVisibleChange handler to prevent infinite loops
          style={{
            zIndex: 1045,
            width: isMobile ? '280px' : isTablet ? '260px' : '240px',
          }}
        >
          <CSidebarHeader className="border-bottom">
            <CSidebarBrand>
              <div style={{ padding: '0.5rem 1rem', fontWeight: 'bold' }}>
                Your Brand
              </div>
            </CSidebarBrand>
            {/* Close button for mobile/tablet */}
            {(isMobile || isTablet) && (
              <button
                onClick={closeSidebarOnMobile}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  marginLeft: 'auto'
                }}
                aria-label="Close sidebar"
              >
                ×
              </button>
            )}
          </CSidebarHeader>
          <CSidebarNav>
            <CNavTitle>Nav Title</CNavTitle>
            <CNavItem href="/dashboard" onClick={closeSidebarOnMobile}>
              <CIcon customClassName="nav-icon" icon={cilSpeedometer} /> Dashboard
            </CNavItem>
            <CNavItem href="/profile" onClick={closeSidebarOnMobile}>
              <CIcon customClassName="nav-icon" icon={cilSpeedometer} /> Profile{' '}
              <CBadge color="primary ms-auto">NEW</CBadge>
            </CNavItem>
            <CNavGroup
              toggler={
                <>
                  <CIcon customClassName="nav-icon" icon={cilPuzzle} /> Settings
                </>
              }
            >
              <CNavItem href="/settings/general" onClick={closeSidebarOnMobile}>
                <span className="nav-icon">
                  <span className="nav-icon-bullet"></span>
                </span>{' '}
                General
              </CNavItem>
              <CNavItem href="/settings/security" onClick={closeSidebarOnMobile}>
                <span className="nav-icon">
                  <span className="nav-icon-bullet"></span>
                </span>{' '}
                Security
              </CNavItem>
            </CNavGroup>
            <CNavItem href="https://coreui.io" onClick={closeSidebarOnMobile}>
              <CIcon customClassName="nav-icon" icon={cilCloudDownload} /> Download CoreUI
            </CNavItem>
            <CNavItem href="https://coreui.io/pro/" onClick={closeSidebarOnMobile}>
              <CIcon customClassName="nav-icon" icon={cilLayers} /> Try CoreUI PRO
            </CNavItem>
          </CSidebarNav>
        </CSidebar>

        <main 
          className="main-content-responsive"
          style={{
            marginLeft: sidebarShow && !isMobile && !isTablet ? '60px' : '0',
            transition: 'margin-left 0.15s ease-in-out',
            padding: isMobile ? '4rem 1rem 1rem' : '1rem',
            minHeight: '100vh'
          }}
        >
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="main-content-full">
      {children}
    </div>
  );
};

export default AuthGuard;