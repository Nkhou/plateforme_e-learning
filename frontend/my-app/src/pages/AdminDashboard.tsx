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
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

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
  Legend
);

interface AdminStats {
  overview: {
    total_users: number;
    total_courses: number;
    active_subscriptions: number;
    recent_users: number;
    recent_courses: number;
  };
  user_distribution: Array<{ Privilege: string; count: number }>;
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

interface FinancialData {
  revenue_stats: {
    labels: string[];
    data: number[];
  };
  course_revenue: {
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
  // const [financial, setFinancial] = useState<FinancialData | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
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
        // case 'financial':
        //   response = await api.get('admin/financial-reports/');
        //   setFinancial(response.data);
        //   break;
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

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const getRandomColor = (opacity = 1) => {
    const colors = [
      `rgba(255, 99, 132, ${opacity})`,
      `rgba(54, 162, 235, ${opacity})`,
      `rgba(255, 206, 86, ${opacity})`,
      `rgba(75, 192, 192, ${opacity})`,
      `rgba(153, 102, 255, ${opacity})`,
      `rgba(255, 159, 64, ${opacity})`,
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

   if (loading) return <div className="d-flex justify-content-center mt-5"><div className="spinner-border"></div></div>;
  return (
    <div className="container-fluid vh-100 d-flex flex-column" style={{ overflow: 'hidden' }}>
      <h1 className="mb-4">Admin Dashboard</h1>
      
      <nav className="nav nav-tabs mb-4">
        {['overview', 'users', 'courses', 'analytics', 'contents',  'system'].map((tab) => (
          <button
            key={tab}
            className={`nav-link ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && stats && (
        <div>
          <div className="row mb-4">
            {[
              { title: 'Total Users', value: stats.overview.total_users, bg: 'primary' },
              { title: 'Total Courses', value: stats.overview.total_courses, bg: 'success' },
              { title: 'Active Subscriptions', value: stats.overview.active_subscriptions, bg: 'info' },
              { title: 'New Users (7d)', value: stats.overview.recent_users, bg: 'warning' },
            ].map((item, index) => (
              <div key={index} className="col-md-3 mb-3">
                <div className={`card text-white bg-${item.bg}`}>
                  <div className="card-body text-center">
                    <h5 className="card-title">{item.title}</h5>
                    <h2 className="card-text">{item.value}</h2>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="card">
                <div className="card-header">
                  <h5>User Registration (Last 30 Days)</h5>
                </div>
                <div className="card-body">
                  <Line
                    data={{
                      labels: stats.user_registration_chart.labels,
                      datasets: [
                        {
                          label: 'New Users',
                          data: stats.user_registration_chart.data,
                          borderColor: 'rgb(75, 192, 192)',
                          backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="card">
                <div className="card-header">
                  <h5>User Distribution by Privilege</h5>
                </div>
                <div className="card-body">
                  <Doughnut
                    data={{
                      labels: stats.user_distribution.map(item => item.Privilege),
                      datasets: [
                        {
                          data: stats.user_distribution.map(item => item.count),
                          backgroundColor: [
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(255, 206, 86, 0.8)',
                          ],
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5>Course Statistics</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Creator</th>
                      <th>Subscribers</th>
                      <th>Completed</th>
                      <th>Completion Rate</th>
                      <th>Avg Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.course_statistics.map((course) => (
                      <tr key={course.id}>
                        <td>{course.title}</td>
                        <td>{course.creator}</td>
                        <td>{course.total_subscribers}</td>
                        <td>{course.completed_count}</td>
                        <td>{course.completion_rate}%</td>
                        <td>{course.average_score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && users && (
        <div>
          <div className="card mb-4">
            <div className="card-header">
              <h5>User Growth (Monthly)</h5>
            </div>
            <div className="card-body">
              <Bar
                data={{
                  labels: users.user_growth.labels,
                  datasets: [
                    {
                      label: 'New Users',
                      data: users.user_growth.data,
                      backgroundColor: 'rgba(53, 162, 235, 0.5)',
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5>User List ({users.users.length} users)</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Full Name</th>
                      <th>Privilege</th>
                      <th>Joined</th>
                      <th>Courses</th>
                      <th>Subscriptions</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.full_name}</td>
                        <td>
                          <span className={`badge ${
                            user.privilege === 'Admin' ? 'bg-danger' :
                            user.privilege === 'Formateur' ? 'bg-warning' : 'bg-info'
                          }`}>
                            {user.privilege}
                          </span>
                        </td>
                        <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                        <td>{user.course_count}</td>
                        <td>{user.subscription_count}</td>
                        <td>
                          <span className={`badge ${user.is_active ? 'bg-success' : 'bg-secondary'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'courses' && courses && (
        <div>
          <div className="card mb-4">
            <div className="card-header">
              <h5>Most Popular Courses (by Enrollment)</h5>
            </div>
            <div className="card-body">
              <Bar
                data={{
                  labels: courses.enrollment_stats.labels.slice(0, 8),
                  datasets: [
                    {
                      label: 'Enrollments',
                      data: courses.enrollment_stats.data.slice(0, 8),
                      backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    },
                  ],
                }}
                options={{
                  ...chartOptions,
                  indexAxis: 'y' as const,
                }}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5>All Courses ({courses.courses.length} courses)</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Creator</th>
                      <th>Subscribers</th>
                      <th>Created</th>
                      <th>Image</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.courses.map((course) => (
                      <tr key={course.id}>
                        <td>{course.title_of_course}</td>
                        <td>{course.creator_username}</td>
                        <td>
                          <span className="badge bg-primary">{course.subscribers_count}</span>
                        </td>
                        <td>{new Date(course.created_at).toLocaleDateString()}</td>
                        <td>
                          {course.image_url && (
                            <img 
                              src={course.image_url} 
                              alt={course.title_of_course}
                              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                              className="rounded"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div>
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card text-center">
                <div className="card-body">
                  <h5>Active Users (30d)</h5>
                  <h3 className="text-primary">{analytics.user_engagement.active_users_30d}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center">
                <div className="card-body">
                  <h5>Engagement Rate</h5>
                  <h3 className="text-success">{analytics.user_engagement.engagement_rate}%</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center">
                <div className="card-body">
                  <h5>Total Users</h5>
                  <h3 className="text-info">{analytics.user_engagement.total_users}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5>Progress Distribution</h5>
                </div>
                <div className="card-body">
                  <Pie
                    data={{
                      labels: analytics.progress_distribution.map(item => item.range),
                      datasets: [
                        {
                          data: analytics.progress_distribution.map(item => item.count),
                          backgroundColor: [
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(255, 206, 86, 0.8)',
                            'rgba(75, 192, 192, 0.8)',
                            'rgba(153, 102, 255, 0.8)',
                            'rgba(255, 159, 64, 0.8)',
                          ],
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5>Weekly Activity</h5>
                </div>
                <div className="card-body">
                  <Line
                    data={{
                      labels: analytics.weekly_activity.labels,
                      datasets: [
                        {
                          label: 'Active Users',
                          data: analytics.weekly_activity.data,
                          borderColor: 'rgb(153, 102, 255)',
                          backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5>Course Performance</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Subscribers</th>
                      <th>Completed</th>
                      <th>Completion Rate</th>
                      <th>Avg Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.course_statistics.map((course) => (
                      <tr key={course.course_id}>
                        <td>{course.course_title}</td>
                        <td>{course.total_subscribers}</td>
                        <td>{course.completed_count}</td>
                        <td>
                          <div className="progress" style={{ height: '20px' }}>
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{ width: `${course.completion_rate}%` }}
                              aria-valuenow={course.completion_rate}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              {course.completion_rate}%
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-info">{course.average_score}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contents' && contents && (
        <div>
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5>Content Type Distribution</h5>
                </div>
                <div className="card-body">
                  <Doughnut
                    data={{
                      labels: contents.content_type_stats.map(item => item.content_type__name),
                      datasets: [
                        {
                          data: contents.content_type_stats.map(item => item.count),
                          backgroundColor: [
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(255, 206, 86, 0.8)',
                          ],
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5>Most Accessed Content</h5>
                </div>
                <div className="card-body">
                  <Bar
                    data={{
                      labels: contents.content_usage.labels.slice(0, 5),
                      datasets: [
                        {
                          label: 'QCM Attempts',
                          data: contents.content_usage.data.slice(0, 5),
                          backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        },
                      ],
                    }}
                    options={{
                      ...chartOptions,
                      indexAxis: 'y' as const,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5>All Content Items ({contents.contents.length} items)</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Course</th>
                      <th>Type</th>
                      <th>Order</th>
                      <th>Created</th>
                      <th>QCM Attempts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contents.contents.map((content) => (
                      <tr key={content.id}>
                        <td>{content.title}</td>
                        <td>{content.course}</td>
                        <td>
                          <span className={`badge ${
                            content.content_type === 'QCM' ? 'bg-danger' :
                            content.content_type === 'Video' ? 'bg-primary' : 'bg-success'
                          }`}>
                            {content.content_type}
                          </span>
                        </td>
                        <td>{content.order}</td>
                        <td>{new Date(content.created_at).toLocaleDateString()}</td>
                        <td>
                          <span className="badge bg-info">{content.qcm_attempts}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* {activeTab === 'financial' && financial && (
        <div>
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5>Monthly Revenue</h5>
                </div>
                <div className="card-body">
                  <Bar
                    data={{
                      labels: financial.revenue_stats.labels,
                      datasets: [
                        {
                          label: 'Revenue ($)',
                          data: financial.revenue_stats.data,
                          backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5>Revenue by Course</h5>
                </div>
                <div className="card-body">
                  <Pie
                    data={{
                      labels: financial.course_revenue.labels,
                      datasets: [
                        {
                          data: financial.course_revenue.data,
                          backgroundColor: [
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(255, 206, 86, 0.8)',
                            'rgba(75, 192, 192, 0.8)',
                          ],
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="card text-center">
                <div className="card-body">
                  <h5>Total Revenue</h5>
                  <h3 className="text-success">
                    ${financial.revenue_stats.data.reduce((a, b) => a + b, 0).toLocaleString()}
                  </h3>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card text-center">
                <div className="card-body">
                  <h5>Average Monthly</h5>
                  <h3 className="text-primary">
                    ${Math.round(financial.revenue_stats.data.reduce((a, b) => a + b, 0) / financial.revenue_stats.data.length).toLocaleString()}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {activeTab === 'system' && systemHealth && (
        <div>
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h5>Database Size</h5>
                  <h3 className="text-info">{systemHealth.system_metrics.database_size}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h5>Active Sessions</h5>
                  <h3 className="text-primary">{systemHealth.system_metrics.active_sessions}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h5>Server Uptime</h5>
                  <h3 className="text-success">{systemHealth.system_metrics.server_uptime}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h5>Error Rate</h5>
                  <h3 className="text-warning">{systemHealth.system_metrics.error_rate}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h5>API Performance (Response Time in ms)</h5>
            </div>
            <div className="card-body">
              <Bar
                data={{
                  labels: systemHealth.performance_stats.labels,
                  datasets: [
                    {
                      label: 'Response Time (ms)',
                      data: systemHealth.performance_stats.data,
                      backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">
              <h5>System Status</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <div className="alert alert-success">
                    <strong>Database:</strong> Connected
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="alert alert-success">
                    <strong>Cache:</strong> Active
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="alert alert-success">
                    <strong>Storage:</strong> Normal
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;