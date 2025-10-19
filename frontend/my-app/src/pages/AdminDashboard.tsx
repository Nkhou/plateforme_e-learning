import React, { useEffect, useState } from 'react';
import api from '../api/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import OverviewStatistics from '../component/admin/overview';
import UsersManagement from '../component/admin/users';
import CoursesManagement from '../component/admin/courses';
import AnalyticsDashboard from '../component/admin/analytics';
import ContentManagement from '../component/admin/content';
import SystemHealth from '../component/admin/systems';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AdminStats {
  overview: {
    total_users: number;
    total_courses: number;
    active_subscriptions: number;
    recent_users: number;
    recent_courses: number;
    engagement_rate?: number;
  };
  user_distribution: Array<{ privilege: string; count: number }>;
  user_registration_chart: {
    labels: string[];
    data: number[];
  };
  course_statistics: Array<{
    id: number;
    title: string;
    creator: string;
    created_at: string;
    total_subscribers: number;
    completed_count: number;
    completion_rate: number;
    average_score: number;
  }>;
  dau_weekly?: {
    labels: string[];
    data: number[];
  };
  account_status?: Array<{ status: string; count: number }>;
}

interface UserData {
  users: Array<{
    id: number;
    username: string;
    email: string;
    full_name: string;
    privilege: string;
    date_joined: string;
    last_login: string;
    is_active: boolean;
    course_count: number;
    subscription_count: number;
  }>;
  user_growth: {
    labels: string[];
    data: number[];
  };
}

interface CourseData {
  courses: Array<any>;
  enrollment_stats: {
    labels: string[];
    data: number[];
  };
}

interface AnalyticsData {
  course_statistics: Array<any>;
  qcm_performance: Array<any>;
  user_engagement: {
    active_users_30d: number;
    total_users: number;
    engagement_rate: number;
  };
  progress_distribution: Array<{
    range: string;
    count: number;
  }>;
  weekly_activity: {
    labels: string[];
    data: number[];
  };
}

interface ContentData {
  contents: Array<any>;
  content_type_stats: Array<{
    content_type__name: string;
    count: number;
  }>;
  content_usage: {
    labels: string[];
    data: number[];
  };
}

interface SystemHealthData {
  system_metrics: {
    database_size: string;
    active_sessions: number;
    server_uptime: string;
    error_rate: string;
  };
  performance_stats: {
    labels: string[];
    data: number[];
  };
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserData | null>(null);
  const [courses, setCourses] = useState<CourseData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [contents, setContents] = useState<ContentData | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeNavItem, setActiveNavItem] = useState('dashboard');

  useEffect(() => {
    fetchData(activeNavItem === 'dashboard' ? activeTab : activeNavItem);
  }, [activeTab, activeNavItem]);
  
  const fetchData = async (tab: string) => {
    try {
      setLoading(true);
      let response;
      
      switch (tab) {
        case 'overview':
          response = await api.get('admin/dashboard/');
          setStats(response.data);
          break;
        case 'analytics':
          response = await api.get('admin/analytics/');
          setAnalytics(response.data);
          break;
        case 'system':
          response = await api.get('admin/system-health/');
          setSystemHealth(response.data);
          break;
        case 'users':
        case 'utilisateurs':
          response = await api.get('admin/users/');
          setUsers(response.data);
          break;
        case 'courses':
        case 'formations':
          response = await api.get('admin/courses/');
          setCourses(response.data);
          break;
        case 'contents':
          response = await api.get('admin/contents/');
          setContents(response.data);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (item: string) => {
    setActiveNavItem(item);
    if (item === 'dashboard') {
      setActiveTab('overview');
    }
  };

  const getSafeNumber = (value: any, defaultValue: number = 0): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseInt(value) || defaultValue;
    return defaultValue;
  };

  const getSafeString = (value: any, defaultValue: string = ''): string => {
    if (typeof value === 'string') return value;
    if (value != null) return String(value);
    return defaultValue;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" style={{ color: '#4F46E5', width: '3rem', height: '3rem' }}></div>
      </div>
    );
  }

  const userRegistrationData = {
    labels: stats?.user_registration_chart?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [{
      label: 'Nouveaux utilisateurs',
      data: stats?.user_registration_chart?.data || [0, 0, 0, 0, 0],
      backgroundColor: '#818CF8',
      borderRadius: 4,
      barThickness: 40,
    }]
  };

  const dauData = stats?.dau_weekly ? {
    labels: stats.dau_weekly.labels,
    datasets: [{
      label: 'DAU',
      data: stats.dau_weekly.data,
      backgroundColor: '#818CF8',
      borderRadius: 4,
      barThickness: 40,
    }]
  } : null;

  const userDistributionData = {
    labels: stats?.user_distribution?.map(d => getSafeString(d.privilege, 'Unknown')) || ['Admin', 'User', 'Guest'],
    datasets: [{
      data: stats?.user_distribution?.map(d => getSafeNumber(d.count, 0)) || [1, 1, 1],
      backgroundColor: ['#4F46E5', '#818CF8', '#C7D2FE'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const accountStatusData = stats?.account_status ? {
    labels: stats.account_status.map(d => getSafeString(d.status, 'Unknown')),
    datasets: [{
      data: stats.account_status.map(d => getSafeNumber(d.count, 0)),
      backgroundColor: ['#4F46E5', '#818CF8'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1F2937',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 6
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#E5E7EB', drawBorder: false },
        ticks: { color: '#6B7280', font: { size: 12 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#6B7280', font: { size: 12 } }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { padding: 20, usePointStyle: true, pointStyle: 'circle', font: { size: 13 }, color: '#4B5563' }
      },
      tooltip: {
        backgroundColor: '#1F2937',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 6
      }
    }
  };

  const getPageTitle = () => {
    switch (activeNavItem) {
      case 'dashboard':
        return activeTab === 'overview' ? 'Dashboard - Overview' : 
               activeTab === 'analytics' ? 'Dashboard - Analytics' : 'Dashboard - System';
      case 'formations':
        return 'Liste des Formations';
      case 'utilisateurs':
        return 'Liste des Utilisateurs';
      case 'messages':
        return 'Messages';
      case 'favoris':
        return 'Favoris';
      default:
        return 'Dashboard';
    }
  };

  const getBreadcrumb = () => {
    if (activeNavItem === 'dashboard') {
      return `Dashboard > ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;
    }
    return activeNavItem.charAt(0).toUpperCase() + activeNavItem.slice(1);
  };

  return (
    <div style={{ backgroundColor: '#F3F4F6', minHeight: '100vh', width: '100%' }}>
      {/* Top Navigation Bar */}
      <nav style={{ backgroundColor: '#2D3748', padding: '0.75rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
          <NavButton active={activeNavItem === 'dashboard'} onClick={() => handleNavigation('dashboard')} icon="⊞" label="Dashboard" />
          <NavButton active={activeNavItem === 'formations'} onClick={() => handleNavigation('formations')} icon="📚" label="Formations" />
          <NavButton active={activeNavItem === 'utilisateurs'} onClick={() => handleNavigation('utilisateurs')} icon="👤" label="Utilisateurs" />
          <NavButton active={activeNavItem === 'messages'} onClick={() => handleNavigation('messages')} icon="✉" label="Messages" />
          <NavButton active={activeNavItem === 'favoris'} onClick={() => handleNavigation('favoris')} icon="⭐" label="Favoris" />
        </div>
      </nav>

      {/* Breadcrumb and Title Header */}
      <div style={{ backgroundColor: '#3730A3', color: 'white', padding: '1.25rem 2rem' }}>
        <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', opacity: 0.9 }}>
          Main {'>'} <span style={{ color: '#FCD34D', fontWeight: '500' }}>{getBreadcrumb()}</span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, letterSpacing: '-0.025em' }}>
          {getPageTitle()}
        </h1>
        {activeNavItem !== 'dashboard' && (
          <p style={{ fontSize: '0.9375rem', marginTop: '0.5rem', marginBottom: 0, opacity: 0.9 }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
          </p>
        )}
      </div>

      {/* Dashboard Content */}
      {activeNavItem === 'dashboard' && stats && (
        <>
          <div style={{ backgroundColor: '#4338CA', padding: '2rem', color: 'white' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
              <StatCard title="N° des utilisateurs" value={getSafeNumber(stats.overview.total_users).toLocaleString()} subtitle="En total" trend="+4.8% vs mois dernier" trendUp={true} />
              <StatCard title="N° de formations" value={getSafeNumber(stats.overview.total_courses)} subtitle="" trend="+4.8% vs mois dernier" trendUp={true} />
              <StatCard title="Nouveaux utilisateurs" value={getSafeNumber(stats.overview.recent_users)} subtitle="" trend="-3.92% vs 7 jours derniers" trendUp={false} />
              <StatCard title="Utilisateurs actifs" value={getSafeNumber(stats.overview.active_subscriptions)} subtitle="" trend="+4.8% vs mois dernier" trendUp={true} />
              {stats.overview.engagement_rate && <StatCard title="Taux d'engagement" value={`${getSafeNumber(stats.overview.engagement_rate)}%`} subtitle="" trend="+4.8% vs mois dernier" trendUp={true} />}
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '0 2rem', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', gap: '2.5rem', maxWidth: '1400px', margin: '0 auto' }}>
              {['overview', 'analytics', 'system'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: 'none', border: 'none', padding: '1.25rem 0', fontSize: '0.95rem', fontWeight: activeTab === tab ? '600' : '500', color: activeTab === tab ? '#4338CA' : '#6B7280', borderBottom: activeTab === tab ? '3px solid #4338CA' : '3px solid transparent', cursor: 'pointer', textTransform: 'capitalize' }}>
                  {tab === 'overview' ? 'Overview' : tab === 'analytics' ? 'Analytics' : 'System'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', paddingBottom: '4rem' }}>
            {activeTab === 'overview' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <ChartCard title="Nouveaux utilisateurs (Derniers 30 jours)" subtitle="Bar chart">
                    <div style={{ height: '300px', position: 'relative' }}><Bar data={userRegistrationData} options={chartOptions} /></div>
                  </ChartCard>
                  {dauData ? (
                    <ChartCard title="DAU / semaine" subtitle="Bar chart">
                      <div style={{ height: '300px', position: 'relative' }}><Bar data={dauData} options={chartOptions} /></div>
                    </ChartCard>
                  ) : (
                    <ChartCard title="DAU / semaine" subtitle="Bar chart">
                      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>No data available</div>
                    </ChartCard>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
                  <ChartCard title="Distribution par rôle du compte" subtitle="Doughnut chart">
                    <div style={{ height: '300px', position: 'relative' }}><Doughnut data={userDistributionData} options={doughnutOptions} /></div>
                  </ChartCard>
                  {accountStatusData ? (
                    <ChartCard title="Distribution par statut du compte" subtitle="Pie chart">
                      <div style={{ height: '300px', position: 'relative' }}><Pie data={accountStatusData} options={doughnutOptions} /></div>
                    </ChartCard>
                  ) : (
                    <ChartCard title="Distribution par statut du compte" subtitle="Pie chart">
                      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>No data available</div>
                    </ChartCard>
                  )}
                </div>
              </>
            )}
            {activeTab === 'analytics' && (
              <div>
                {analytics ? (
                  <AnalyticsDashboard analytics={analytics} />
                ) : (
                  <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: '#4B5563', marginBottom: '0.5rem' }}>Analytics Dashboard</h3>
                    <p style={{ color: '#9CA3AF' }}>Loading analytics data...</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'system' && (
              <div>
                {systemHealth ? (
                  <SystemHealth systemHealth={systemHealth} />
                ) : (
                  <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ color: '#4B5563', marginBottom: '0.5rem' }}>System Health</h3>
                    <p style={{ color: '#9CA3AF' }}>Loading system health data...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Users Section */}
      {activeNavItem === 'utilisateurs' && users && <UsersManagement users={users} />}

      {/* Courses Section */}
      {activeNavItem === 'formations' && courses && <CoursesManagement courses={courses} />}

      {/* Content Section */}
      {activeNavItem === 'contents' && contents && <ContentManagement contents={contents} />}

      {/* Messages Section */}
      {activeNavItem === 'messages' && (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: '#4B5563', marginBottom: '0.5rem' }}>Messages</h3>
            <p style={{ color: '#9CA3AF' }}>Content coming soon...</p>
          </div>
        </div>
      )}

      {/* Favoris Section */}
      {activeNavItem === 'favoris' && (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: '#4B5563', marginBottom: '0.5rem' }}>Favoris</h3>
            <p style={{ color: '#9CA3AF' }}>Content coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: active ? '#4338CA' : 'transparent', color: active ? 'white' : '#A0AEC0', border: 'none', padding: '0.625rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9375rem', fontWeight: '500', transition: 'all 0.2s ease' }}>
    <span style={{ fontSize: '1.125rem' }}>{icon}</span>
    {label}
  </button>
);

const StatCard: React.FC<{ title: string; value: string | number; subtitle: string; trend: string; trendUp: boolean }> = ({ title, value, subtitle, trend, trendUp }) => (
  <div style={{ lineHeight: '1.5' }}>
    <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', opacity: 0.9, fontWeight: '400' }}>{title}</div>
    <div style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>{value}</div>
    {subtitle && <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>{subtitle}</div>}
    <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: trendUp ? '#86EFAC' : '#FCA5A5', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      <span style={{ fontSize: '1rem' }}>{trendUp ? '▲' : '▼'}</span>
      <span>{trend}</span>
    </div>
  </div>
);

const ChartCard: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
    <div style={{ marginBottom: '1.25rem' }}>
      <h3 style={{ fontSize: '1.0625rem', fontWeight: '600', color: '#1F2937', margin: '0 0 0.375rem 0' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>{subtitle}</p>
    </div>
    {children}
  </div>
);

export default AdminDashboard;