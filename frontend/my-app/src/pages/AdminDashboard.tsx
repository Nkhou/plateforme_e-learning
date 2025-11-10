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
import { NavigationContext } from '../layout'

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
    trends?: {
      total_users?: { formatted: string; is_positive: boolean };
      total_courses?: { formatted: string; is_positive: boolean };
      recent_users?: { formatted: string; is_positive: boolean };
      active_subscriptions?: { formatted: string; is_positive: boolean };
      engagement_rate?: { formatted: string; is_positive: boolean };
    };
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
  content_type_statistics?: Array<{
    content_type__name: string;
    count: number;
  }>;
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

// Sample stats for demonstration
const sampleStats = {
  overview: {
    total_users: 1250,
    total_courses: 89,
    active_subscriptions: 843,
    recent_users: 32,
    recent_courses: 5,
    engagement_rate: 68,
    trends: {
      total_users: { formatted: "+4.8%", is_positive: true },
      total_courses: { formatted: "+2.1%", is_positive: true },
      recent_users: { formatted: "-3.9%", is_positive: false },
      active_subscriptions: { formatted: "+1.2%", is_positive: true },
      engagement_rate: { formatted: "+5.3%", is_positive: true }
    }
  },
  user_distribution: [
    { privilege: "Admin", count: 5 },
    { privilege: "Instructor", count: 45 },
    { privilege: "Student", count: 1200 }
  ],
  user_registration_chart: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    data: [65, 59, 80, 81, 56, 55]
  },
  course_statistics: [],
  dau_weekly: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data: [430, 450, 470, 460, 480, 490, 500]
  },
  account_status: [
    { status: "Active", count: 1180 },
    { status: "Inactive", count: 70 }
  ]
};

// StatCardsSection Component
const StatCardsSection: React.FC<{ stats: any }> = ({ stats }) => {
  const trends = stats?.overview?.trends || {};

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
      gap: '1rem', 
      maxWidth: '1400px', 
      margin: '0 auto',
      padding: '0 1rem'
    }}>
      <StatCard
        title="N° des utilisateurs"
        value={stats?.overview?.total_users?.toLocaleString() || '0'}
        subtitle=""
        trend={trends.total_users?.formatted || "+0%"}
        trendLabel="vs mois dernier"
        trendUp={trends.total_users?.is_positive !== false}
      />

      <StatCard
        title="N° de formations"
        value={stats?.overview?.total_courses || 0}
        subtitle=""
        trend={trends.total_courses?.formatted || "+0%"}
        trendLabel="vs mois dernier"
        trendUp={trends.total_courses?.is_positive !== false}
      />

      <StatCard
        title="Nouveaux utilisateurs"
        value={stats?.overview?.recent_users || 0}
        subtitle=""
        trend={trends.recent_users?.formatted || "+0%"}
        trendLabel="vs 7 jours derniers"
        trendUp={trends.recent_users?.is_positive !== false}
      />

      <StatCard
        title="Utilisateurs actifs"
        value={stats?.overview?.active_subscriptions || 0}
        subtitle=""
        trend={trends.active_subscriptions?.formatted || "+0%"}
        trendLabel="vs mois dernier"
        trendUp={trends.active_subscriptions?.is_positive !== false}
      />

      {stats?.overview?.engagement_rate && (
        <StatCard
          title="Taux d'engagement"
          value={`${stats.overview.engagement_rate}%`}
          subtitle=""
          trend={trends.engagement_rate?.formatted || "+0%"}
          trendLabel="vs mois dernier"
          trendUp={trends.engagement_rate?.is_positive !== false}
        />
      )}
    </div>
  );
};

// StatCard Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle: string;
  trend: string;
  trendLabel: string;
  trendUp: boolean;
}> = ({ title, value, subtitle, trend, trendLabel, trendUp }) => (
  <div style={{ 
    lineHeight: '1.5',
    padding: '0.5rem'
  }}>
    <div style={{ 
      fontSize: '0.875rem', 
      marginBottom: '0.5rem', 
      opacity: 0.9, 
      fontWeight: '400',
      wordWrap: 'break-word'
    }}>
      {title}
    </div>
    <div style={{ 
      fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', 
      fontWeight: 'bold', 
      marginBottom: '0.25rem', 
      letterSpacing: '-0.02em',
      lineHeight: '1.2'
    }}>
      {value}
    </div>
    {subtitle && (
      <div style={{ 
        fontSize: '0.875rem', 
        opacity: 0.8, 
        marginBottom: '0.5rem' 
      }}>
        {subtitle}
      </div>
    )}
    <div style={{
      fontSize: '0.75rem',
      marginTop: '0.5rem',
      color: trendUp ? '#86EFAC' : '#FCA5A5',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      flexWrap: 'wrap'
    }}>
      <span style={{ fontSize: '0.875rem' }}>
        {trendUp ? '▲' : '▼'}
      </span>
      <span>{trend} {trendLabel}</span>
    </div>
  </div>
);

// ChartCard Component
const ChartCard: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div style={{ 
    backgroundColor: 'white', 
    borderRadius: '8px', 
    padding: '1rem', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    width: '100%',
    boxSizing: 'border-box'
  }}>
    <div style={{ marginBottom: '1rem' }}>
      <h3 style={{ 
        fontSize: 'clamp(0.9rem, 2vw, 1.0625rem)', 
        fontWeight: '600', 
        color: '#1F2937', 
        margin: '0 0 0.375rem 0',
        lineHeight: '1.3'
      }}>{title}</h3>
      <p style={{ 
        fontSize: '0.75rem', 
        color: '#6B7280', 
        margin: 0 
      }}>{subtitle}</p>
    </div>
    {children}
  </div>
);

// NavButton Component
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
      padding: '0.5rem 0.75rem',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: 'clamp(0.8rem, 2vw, 0.9375rem)',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap'
    }}
  >
    <span style={{ fontSize: '1rem' }}>{icon}</span>
    <span style={{ 
      display: 'inline-block',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }}>{label}</span>
  </button>
);
import { createContext, useContext } from 'react';

interface NavigationContextType {
  activeTab: string;
  activeNavItem: string;
  setActiveTab: (tab: string) => void;
  setActiveNavItem: (item: string) => void;
}

// const NavigationContext = createContext<NavigationContextType | undefined>(undefined);
// import { createContext, useContext } from 'react';
// const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const AdminDashboard: React.FC = () => {
  // const { activeTab, activeNavItem } = useContext(NavigationContext);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserData | null>(null);
  const [courses, setCourses] = useState<CourseData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [contents, setContents] = useState<ContentData | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  // const [activeTab, setActiveTab] = useState('overview');
  // const [activeNavItem, setActiveNavItem] = useState('dashboard');
const context = useContext(NavigationContext);
if (!context) {
  throw new Error("useContext must be used within a NavigationProvider");
}

const { activeTab, activeNavItem } = context;
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

  // const handleNavigation = (item: string) => {
  //   setActiveNavItem(item);
  //   if (item === 'dashboard') {
  //     setActiveTab('overview');
  //   }
  // };

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
  labels: stats?.user_registration_chart?.labels || [],
  datasets: [{
    label: 'Nouveaux utilisateurs',
    data: stats?.user_registration_chart?.data || [],
    backgroundColor: '#818CF8',
    borderRadius: 4,
    barThickness: 'flex' as const, // Add 'as const' to fix the type issue
  }]
};

  const dauData = stats?.dau_weekly ? {
  labels: stats.dau_weekly.labels,
  datasets: [{
    label: 'DAU',
    data: stats.dau_weekly.data,
    backgroundColor: '#818CF8',
    borderRadius: 4,
    barThickness: 'flex' as const, // Add 'as const' to fix the type issue
  }]
} : null;

  const userDistributionData = {
    labels: stats?.user_distribution?.map(d => getSafeString(d.privilege)) || [],
    datasets: [{
      data: stats?.user_distribution?.map(d => getSafeNumber(d.count)) || [],
      backgroundColor: ['#4F46E5', '#818CF8', '#C7D2FE'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const accountStatusData = stats?.account_status ? {
    labels: stats.account_status.map(d => getSafeString(d.status)),
    datasets: [{
      data: stats.account_status.map(d => getSafeNumber(d.count)),
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
        labels: { 
          padding: 20, 
          usePointStyle: true, 
          pointStyle: 'circle', 
          font: { size: 13 }, 
          color: '#4B5563' 
        }
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
    <div style={{ backgroundColor: '#F3F4F6', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      {/* Breadcrumb and Title Header */}
      {/* <div style={{ 
        backgroundColor: '#212068', 
        color: 'white', 
        padding: '1rem clamp(1rem, 3vw, 2rem)'
      }}>
        <div style={{ 
          fontSize: '0.75rem', 
          marginBottom: '0.5rem', 
          opacity: 0.9,
          wordWrap: 'break-word'
        }}>
          Main {'>'} <span style={{ color: '#FCD34D', fontWeight: '500' }}>{getBreadcrumb()}</span>
        </div>
        <h1 style={{ 
          fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', 
          fontWeight: 'bold', 
          margin: 0, 
          letterSpacing: '-0.025em',
          lineHeight: '1.2'
        }}>
          {getPageTitle()}
        </h1> */}
        {/* {activeNavItem !== 'dashboard' && (
          <p style={{ 
            fontSize: '0.875rem', 
            marginTop: '0.5rem', 
            marginBottom: 0, 
            opacity: 0.9,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
          </p>
        )}
      </div> */}

      {/* Dashboard Content */}
      {activeNavItem === 'dashboard' && stats && (
        <>
          {/* <div style={{ 
            backgroundColor: '#212068', 
            padding: '1.5rem 1rem',
            color: 'white' 
          }}>
            <StatCardsSection stats={stats} />
          </div>

          <div style={{ 
            backgroundColor: 'white', 
            padding: '0 clamp(1rem, 3vw, 2rem)', 
            borderBottom: '1px solid #E5E7EB',
            overflowX: 'auto'
          }}> */}
            {/* <div style={{ 
              display: 'flex', 
              gap: 'clamp(1rem, 3vw, 2.5rem)', 
              maxWidth: '1400px', 
              margin: '0 auto',
              minWidth: 'min-content'
            }}> */}
              {/* {['overview', 'analytics', 'system'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '1rem 0',
                    fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                    fontWeight: activeTab === tab ? '600' : '500',
                    color: activeTab === tab ? '#4338CA' : '#6B7280',
                    borderBottom: activeTab === tab ? '3px solid #4338CA' : '3px solid transparent',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap',
                    minWidth: 'max-content'
                  }}
                >
                  {tab === 'overview' ? 'Overview' : tab === 'analytics' ? 'Analytics' : 'System'}
                </button>
              ))} */}
            {/* </div> */}
          {/* </div> */}

          <div style={{ 
            padding: '1.5rem clamp(1rem, 3vw, 2rem)', 
            maxWidth: '1400px', 
            margin: '0 auto', 
            paddingBottom: '3rem' 
          }}>
            {activeTab === 'overview' && (
              <>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', 
                  gap: '1rem', 
                  marginBottom: '1.5rem' 
                }}>
                  <ChartCard title="Nouveaux utilisateurs (Derniers 30 jours)" subtitle="Bar chart">
                    <div style={{ height: 'clamp(250px, 40vw, 300px)', position: 'relative' }}>
                      {stats.user_registration_chart && stats.user_registration_chart.data.length > 0 ? (
                        <Bar data={userRegistrationData} options={chartOptions} />
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                          No user registration data available
                        </div>
                      )}
                    </div>
                  </ChartCard>
                  {dauData ? (
                    <ChartCard title="DAU / semaine" subtitle="Bar chart">
                      <div style={{ height: 'clamp(250px, 40vw, 300px)', position: 'relative' }}>
                        {stats.dau_weekly && stats.dau_weekly.data.length > 0 ? (
                          <Bar data={dauData} options={chartOptions} />
                        ) : (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                            No DAU data available
                          </div>
                        )}
                      </div>
                    </ChartCard>
                  ) : (
                    <ChartCard title="DAU / semaine" subtitle="Bar chart">
                      <div style={{ height: 'clamp(250px, 40vw, 300px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>No DAU data available</div>
                    </ChartCard>
                  )}
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', 
                  gap: '1rem' 
                }}>
                  <ChartCard title="Distribution par rôle du compte" subtitle="Doughnut chart">
                    <div style={{ height: 'clamp(250px, 40vw, 300px)', position: 'relative' }}>
                      {stats.user_distribution && stats.user_distribution.length > 0 ? (
                        <Doughnut data={userDistributionData} options={doughnutOptions} />
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                          No user distribution data available
                        </div>
                      )}
                    </div>
                  </ChartCard>
                  {accountStatusData ? (
                    <ChartCard title="Distribution par statut du compte" subtitle="Pie chart">
                      <div style={{ height: 'clamp(250px, 40vw, 300px)', position: 'relative' }}>
                        {stats.account_status && stats.account_status.length > 0 ? (
                          <Pie data={accountStatusData} options={doughnutOptions} />
                        ) : (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                            No account status data available
                          </div>
                        )}
                      </div>
                    </ChartCard>
                  ) : (
                    <ChartCard title="Distribution par statut du compte" subtitle="Pie chart">
                      <div style={{ height: 'clamp(250px, 40vw, 300px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>No account status data available</div>
                    </ChartCard>
                  )}
                </div>
              </>
            )}
            {activeTab === 'analytics' && (
              <div>
                {analytics ? (
                  <>
                    {/* Charts Grid - Top Row */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', 
                      gap: '1rem', 
                      marginBottom: '1.5rem' 
                    }}>
                      {/* Progress Distribution Chart */}
                      <ChartCard title="Progress distribution" subtitle="Doughnut / Pie chart">
                        <div style={{ height: 'clamp(250px, 40vw, 300px)', position: 'relative' }}>
                          {analytics.progress_distribution && analytics.progress_distribution.length > 0 ? (
                            <Doughnut
                              data={{
                                labels: analytics.progress_distribution.map(d => d.range),
                                datasets: [{
                                  data: analytics.progress_distribution.map(d => d.count),
                                  backgroundColor: ['#4F46E5', '#818CF8', '#C7D2FE', '#E0E7FF'],
                                  borderWidth: 0,
                                  hoverOffset: 4
                                }]
                              }}
                              options={doughnutOptions}
                            />
                          ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                                <div>No progress distribution data available</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </ChartCard>

                      {/* Statistics by Content Type */}
                      <ChartCard title="Statistiques par type de contenu" subtitle="Doughnut / Pie chart">
                        <div style={{ height: 'clamp(250px, 40vw, 300px)', position: 'relative' }}>
                          {analytics.content_type_statistics && analytics.content_type_statistics.length > 0 ? (
                            <Doughnut
                              data={{
                                labels: analytics.content_type_statistics.map(d => d.content_type__name),
                                datasets: [{
                                  data: analytics.content_type_statistics.map(d => d.count),
                                  backgroundColor: ['#4F46E5', '#818CF8', '#C7D2FE', '#E0E7FF', '#A78BFA', '#DDD6FE'],
                                  borderWidth: 0,
                                  hoverOffset: 4
                                }]
                              }}
                              options={doughnutOptions}
                            />
                          ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
                                <div>No content type data available</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </ChartCard>
                    </div>

                    {/* Formations Statistics Table */}
                    <div style={{ 
                      backgroundColor: 'white', 
                      borderRadius: '8px', 
                      padding: '1rem', 
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      overflowX: 'auto'
                    }}>
                      <h3 style={{ 
                        fontSize: 'clamp(1rem, 2vw, 1.125rem)', 
                        fontWeight: '600', 
                        color: '#1F2937', 
                        marginBottom: '1rem' 
                      }}>
                        Statistiques de formations
                      </h3>
                      <div style={{ minWidth: '600px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#E5E7EB' }}>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Titre de la formation</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Créé par</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Subscribers</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Completed</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Completion rate</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Avg. Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.course_statistics && analytics.course_statistics.length > 0 ? (
                              analytics.course_statistics.map((course: any, index: number) => (
                                <tr key={course.id || index} style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: index % 2 === 0 ? 'white' : '#F9FAFB' }}>
                                  <td style={{ padding: '0.75rem', color: '#1F2937' }}>
                                    {getSafeString(course.course_title, 'Lorem ipsum dolor sit amet, consectetur')}
                                  </td>
                                  <td style={{ padding: '0.75rem', color: '#6B7280' }}>
                                    {getSafeString(course.creator, 'Hannah Arendt')}
                                  </td>
                                  <td style={{ padding: '0.75rem', color: '#1F2937' }}>
                                    {getSafeNumber(course.total_subscribers || course.subscribers, 10)} subsc.
                                  </td>
                                  <td style={{ padding: '0.75rem', color: '#1F2937' }}>
                                    {getSafeNumber(course.completed_count || course.completed, 4)}
                                  </td>
                                  <td style={{ padding: '0.75rem' }}>
                                    <span style={{
                                      color: getSafeNumber(course.completion_rate, 40) >= 70 ? '#10B981' : '#EF4444',
                                      fontWeight: '500'
                                    }}>
                                      {getSafeNumber(course.completion_rate, 40)} %
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.75rem', color: '#1F2937' }}>
                                    {getSafeNumber(course.average_score || course.avg_score, 76.3)}%
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <>
                                {[1, 2, 3, 4].map((i) => (
                                  <tr key={i} style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: i % 2 === 0 ? 'white' : '#F9FAFB' }}>
                                    <td style={{ padding: '0.75rem', color: '#1F2937' }}>Lorem ipsum dolor sit amet, consectetur</td>
                                    <td style={{ padding: '0.75rem', color: '#6B7280' }}>{i % 2 === 0 ? 'Hannah Arendt' : 'Bell Hooks'}</td>
                                    <td style={{ padding: '0.75rem', color: '#1F2937' }}>{i === 3 ? '14' : '10'} subsc.</td>
                                    <td style={{ padding: '0.75rem', color: '#1F2937' }}>{i === 2 ? '8' : i === 3 ? '6' : '4'}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                      <span style={{ color: i === 2 ? '#10B981' : '#EF4444', fontWeight: '500' }}>
                                        {i === 2 ? '80' : '40'} %
                                      </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', color: '#1F2937' }}>76.3%</td>
                                  </tr>
                                ))}
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '2rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
                  <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '2rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
      {/* {activeNavItem === 'utilisateurs' && users && <UsersManagement users={users} />} */}

      {/* Courses Section */}
      {/* {activeNavItem === 'formations' && courses && <CoursesManagement courses={courses} />} */}

      {/* Content Section */}
      {activeNavItem === 'contents' && contents && <ContentManagement contents={contents} />}

      {/* Messages Section */}
      {activeNavItem === 'messages' && (
        <div style={{ padding: '1.5rem clamp(1rem, 3vw, 2rem)', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: '#4B5563', marginBottom: '0.5rem' }}>Messages</h3>
            <p style={{ color: '#9CA3AF' }}>Content coming soon...</p>
          </div>
        </div>
      )}

      {/* Favoris Section */}
      {activeNavItem === 'favoris' && (
        <div style={{ padding: '1.5rem clamp(1rem, 3vw, 2rem)', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: '#4B5563', marginBottom: '0.5rem' }}>Favoris</h3>
            <p style={{ color: '#9CA3AF' }}>Content coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;