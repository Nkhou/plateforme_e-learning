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
// import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import OverviewStatistics from '../component/admin/overview';
import UsersManagement from '../component/admin/users';
import CoursesManagement from '../component/admin/courses';
import AnalyticsDashboard from '../component/admin/analytics';
import ContentManagement from '../component/admin/content';
import SystemHealth from '../component/admin/systems';

// Register ChartJS components including Filler
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

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);
  
  const fetchData = async (tab: string) => {
    try {
      setLoading(true);
      let response;
      
      switch (tab) {
        case 'overview':
          response = await api.get('admin/dashboard/');
          setStats(response.data);
          break;
        case 'users':
          response = await api.get('admin/users/');
          setUsers(response.data);
          break;
        case 'courses':
          response = await api.get('admin/courses/');
          setCourses(response.data);
          break;
        case 'analytics':
          response = await api.get('admin/analytics/');
          setAnalytics(response.data);
          break;
        case 'contents':
          response = await api.get('admin/contents/');
          setContents(response.data);
          break;
        case 'system':
          response = await api.get('admin/system-health/');
          setSystemHealth(response.data);
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

   if (loading) return (
     <div className="d-flex justify-content-center align-items-center min-vh-100">
       <div className="spinner-border text-primary" style={{ color: '#052c65' }}></div>
     </div>
   );
   
  return (
    <div 
      className="container-fluid py-3" 
      style={{ 
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        overflowY: 'auto', // Ensure vertical scrolling
        overflowX: 'hidden', // Prevent horizontal scroll
        width: '100%',
        position: 'relative' // Important for proper layout
      }}
    >
      <h1 className="mb-4 fw-bold" style={{ color: '#052c65' }}>Admin Dashboard</h1>
      
      <div className="card shadow-sm mb-4">
        <div className="card-body p-2">
          <div className="d-flex flex-wrap">
            {['overview', 'users', 'courses', 'analytics', 'contents', 'system'].map((tab) => (
              <button
                key={tab}
                className={`btn btn-sm m-1 ${activeTab === tab ? 
                  'text-white' : 'btn-outline-primary'}`}
                style={activeTab === tab ? 
                  { backgroundColor: '#052c65', borderColor: '#052c65' } : 
                  { borderColor: '#052c65', color: '#052c65' }}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ paddingBottom: '80px' }}> {/* Add padding bottom for scroll button */}
        {activeTab === 'overview' && stats && (
          <OverviewStatistics stats={stats} />
        )}

        {activeTab === 'users' && users && (
          <UsersManagement users={users}/>
        )}

        {activeTab === 'courses' && courses && (
          <CoursesManagement courses={courses} />
        )}

        {activeTab === 'analytics' && analytics && (
          <AnalyticsDashboard analytics={analytics}/>
        )}

        {activeTab === 'contents' && contents && (
          <ContentManagement  contents={contents} />
        )}

        {activeTab === 'system' && systemHealth && (
          <SystemHealth systemHealth={systemHealth} />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;