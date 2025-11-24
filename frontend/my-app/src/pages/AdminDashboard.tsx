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
import ContentManagement from '../component/admin/content';
import SystemHealth from '../component/admin/systems';
import { NavigationContext } from '../layout';
import {  useContext } from 'react';

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

// Add notification types and interfaces
export type NotificationType = "success" | "info" | "warning" | "error";

type NotificationItem = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  duration: number;
};

type NotificationProps = {
  type: NotificationType;
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
};

type NotificationContainerProps = {
  notifications: NotificationItem[];
  removeNotification: (id: number) => void;
};

// Notification Component
const Notification: React.FC<NotificationProps> = ({
  type = "success",
  title,
  message,
  onClose,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => handleClose(), duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const styles: Record<
    NotificationType,
    { titleColor: string; backgroundColor: string; borderColor: string }
  > = {
    success: {
      titleColor: "#10B981",
      backgroundColor: "#1F2937",
      borderColor: "#10B981",
    },
    info: {
      titleColor: "#3B82F6",
      backgroundColor: "#1F2937",
      borderColor: "#3B82F6",
    },
    warning: {
      titleColor: "#F59E0B",
      backgroundColor: "#1F2937",
      borderColor: "#F59E0B",
    },
    error: {
      titleColor: "#EF4444",
      backgroundColor: "#1F2937",
      borderColor: "#EF4444",
    },
  };

  const currentStyle = styles[type];

  return (
    <div
      style={{
        backgroundColor: currentStyle.backgroundColor,
        borderRadius: "12px",
        padding: "20px 24px",
        marginBottom: "16px",
        width: "460px",
        maxWidth: "90vw",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
        borderLeft: `4px solid ${currentStyle.borderColor}`,
        animation: isExiting
          ? "slideOut 0.3s ease-out forwards"
          : "slideIn 0.3s ease-out",
        position: "relative",
      }}
    >
      <div style={{ marginBottom: "8px" }}>
        <span
          style={{
            color: currentStyle.titleColor,
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.5px",
          }}
        >
          {title}
        </span>
        <span style={{ color: "#9CA3AF", fontSize: "14px", margin: "0 8px" }}>
          •
        </span>
        <span style={{ color: "#E5E7EB", fontSize: "13px", fontWeight: 400 }}>
          {type === "success" && "Données enregistrées"}
          {type === "info" && "Quelques informations à vous communiquer"}
          {type === "warning" && "Attention à ce que vous avez fait"}
          {type === "error" && "Informations non enregistrées, réessayer"}
        </span>
      </div>

      <p
        style={{
          color: "#D1D5DB",
          fontSize: "13px",
          lineHeight: "1.6",
          margin: "0 0 16px 0",
        }}
      >
        {message}
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleClose}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "#F97316",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            padding: "4px 8px",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Ok, fermer
        </button>
      </div>
    </div>
  );
};

// Notification Container Component
const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  removeNotification,
}) => (
  <div
    style={{
      position: "fixed",
      bottom: "24px",
      left: "24px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column-reverse",
      gap: "0",
    }}
  >
    {notifications.map((n) => (
      <Notification
        key={n.id}
        type={n.type}
        title={n.title}
        message={n.message}
        duration={n.duration}
        onClose={() => removeNotification(n.id)}
      />
    ))}
  </div>
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

const AdminDashboard: React.FC = () => {
  // Add notification state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Add notification functions
  const addNotification = (
    type: NotificationType,
    title: string,
    message: string,
    duration: number = 5000
  ) => {
    const notificationId = Date.now();
    setNotifications((prev) => [
      ...prev,
      { id: notificationId, type, title, message, duration },
    ]);
  };

  const removeNotification = (id: number) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [contents, setContents] = useState<ContentData | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useContext must be used within a NavigationProvider");
  }

  const { activeTab, activeNavItem } = context;

  useEffect(() => {
    console.log('----------------------------------------------------');
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
          addNotification("success", "Données chargées", "Les données du tableau de bord ont été chargées avec succès", 3000);
          break;
        case 'analytics':
          response = await api.get('admin/analytics/');
          setAnalytics(response.data);
          addNotification("success", "Analytics chargés", "Les données analytiques ont été chargées avec succès", 3000);
          break;
        case 'system':
          response = await api.get('admin/system-health/');
          setSystemHealth(response.data);
          addNotification("success", "Santé système chargée", "Les données de santé du système ont été chargées avec succès", 3000);
          break;
        case 'users':
        case 'utilisateurs':
          response = await api.get('admin/users/');
          // setUsers(response.data);
          addNotification("success", "Utilisateurs chargés", "Les données des utilisateurs ont été chargées avec succès", 3000);
          break;
        case 'courses':
        case 'formations':
          response = await api.get('admin/courses/');
          // setCourses(response.data);
          addNotification("success", "Formations chargées", "Les données des formations ont été chargées avec succès", 3000);
          break;
        case 'contents':
          response = await api.get('admin/contents/');
          setContents(response.data);
          addNotification("success", "Contenus chargés", "Les données des contenus ont été chargées avec succès", 3000);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      addNotification("error", "Erreur de chargement", "Impossible de charger les données. Veuillez réessayer.", 5000);
    } finally {
      setLoading(false);
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
    labels: stats?.user_registration_chart?.labels || [],
    datasets: [{
      label: 'Nouveaux utilisateurs',
      data: stats?.user_registration_chart?.data || [],
      backgroundColor: '#818CF8',
      borderRadius: 4,
      barThickness: 'flex' as const,
    }]
  };

  const dauData = stats?.dau_weekly ? {
    labels: stats.dau_weekly.labels,
    datasets: [{
      label: 'DAU',
      data: stats.dau_weekly.data,
      backgroundColor: '#818CF8',
      borderRadius: 4,
      barThickness: 'flex' as const,
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


  return (
    <div style={{ backgroundColor: '#F3F4F6', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      {/* Notification Container */}
      {/* <NotificationContainer 
        notifications={notifications} 
        removeNotification={removeNotification} 
      /> */}

      {/* Dashboard Content */}
      {activeNavItem === 'dashboard' && stats && (
        <>
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
                                    {getSafeNumber(course.total_subscribers)} subsc.
                                  </td>
                                  <td style={{ padding: '0.75rem', color: '#1F2937' }}>
                                    {getSafeNumber(course.completed_count )}
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
                                    {getSafeNumber(course.average_score )}%
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
      {/* {activeNavItem === 'contents' && contents && <ContentManagement contents={contents} />} */}

      {/* Messages Section */}
      {/* {activeNavItem === 'messages' && (
        <div style={{ padding: '1.5rem clamp(1rem, 3vw, 2rem)', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: '#4B5563', marginBottom: '0.5rem' }}>Messages</h3>
            <p style={{ color: '#9CA3AF' }}>Content coming soon...</p>
          </div>
        </div>
      )} */}

      {/* Favoris Section */}
      {/* {activeNavItem === 'favoris' && (
        <div style={{ padding: '1.5rem clamp(1rem, 3vw, 2rem)', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ color: '#4B5563', marginBottom: '0.5rem' }}>Favoris</h3>
            <p style={{ color: '#9CA3AF' }}>Content coming soon...</p>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default AdminDashboard;