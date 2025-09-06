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
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  // const getRandomColor = (opacity = 1) => {
  //   const colors = [
  //     `rgba(5, 44, 101, ${opacity})`,
  //     `rgba(54, 162, 235, ${opacity})`,
  //     `rgba(255, 206, 86, ${opacity})`,
  //     `rgba(75, 192, 192, ${opacity})`,
  //     `rgba(153, 102, 255, ${opacity})`,
  //     `rgba(255, 159, 64, ${opacity})`,
  //   ];
  //   return colors[Math.floor(Math.random() * colors.length)];
  // };

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
          // <div>
          //   <div className="row mb-4">
          //     {[
          //       { title: 'Total Users', value: stats.overview.total_users, icon: '👥' },
          //       { title: 'Total Courses', value: stats.overview.total_courses, icon: '📚' },
          //       { title: 'Active Subscriptions', value: stats.overview.active_subscriptions, icon: '🔔' },
          //       { title: 'New Users (7d)', value: stats.overview.recent_users, icon: '🆕' },
          //     ].map((item, index) => (
          //       <div key={index} className="col-xl-3 col-md-6 mb-3">
          //         <div className="card h-100 shadow-sm border-0">
          //           <div className="card-body text-center p-3">
          //             <div className="fs-1 mb-2">{item.icon}</div>
          //             <h5 className="card-title text-muted">{item.title}</h5>
          //             <h2 className="card-text fw-bold" style={{ color: '#052c65' }}>{item.value}</h2>
          //           </div>
          //         </div>
          //       </div>
          //     ))}
          //   </div>

          //   <div className="row">
          //     <div className="col-xl-6 col-lg-12 mb-4">
          //       <div className="card shadow-sm h-100">
          //         <div className="card-header bg-white">
          //           <h5 className="m-0" style={{ color: '#052c65' }}>User Registration (Last 30 Days)</h5>
          //         </div>
          //         <div className="card-body" style={{ height: '300px' }}>
          //           <Line
          //             data={{
          //               labels: stats.user_registration_chart.labels,
          //               datasets: [
          //                 {
          //                   label: 'New Users',
          //                   data: stats.user_registration_chart.data,
          //                   borderColor: '#052c65',
          //                   backgroundColor: 'rgba(5, 44, 101, 0.2)',
          //                   tension: 0.3,
          //                   fill: true,
          //                 },
          //               ],
          //             }}
          //             options={chartOptions}
          //           />
          //         </div>
          //       </div>
          //     </div>

          //     <div className="col-xl-6 col-lg-12 mb-4">
          //       <div className="card shadow-sm h-100">
          //         <div className="card-header bg-white">
          //           <h5 className="m-0" style={{ color: '#052c65' }}>User Distribution by Privilege</h5>
          //         </div>
          //         <div className="card-body" style={{ height: '300px' }}>
          //           <Doughnut
          //             data={{
          //               labels: stats.user_distribution.map(item => item.Privilege),
          //               datasets: [
          //                 {
          //                   data: stats.user_distribution.map(item => item.count),
          //                   backgroundColor: [
          //                     '#052c65',
          //                     '#0d6efd',
          //                     '#3b8ffa',
          //                     '#0dcaf0',
          //                     '#198754'
          //                   ],
          //                 },
          //               ],
          //             }}
          //             options={chartOptions}
          //           />
          //         </div>
          //       </div>
          //     </div>
          //   </div>

          //   <div className="card shadow-sm">
          //     <div className="card-header bg-white">
          //       <h5 className="m-0" style={{ color: '#052c65' }}>Course Statistics</h5>
          //     </div>
          //     <div className="card-body p-0">
          //       <div className="table-responsive">
          //         <table className="table table-hover m-0">
          //           <thead style={{ backgroundColor: 'rgba(5, 44, 101, 0.1)' }}>
          //             <tr>
          //               <th style={{ color: '#052c65' }}>Course</th>
          //               <th style={{ color: '#052c65' }}>Creator</th>
          //               <th style={{ color: '#052c65' }}>Subscribers</th>
          //               <th style={{ color: '#052c65' }}>Completed</th>
          //               <th style={{ color: '#052c65' }}>Completion Rate</th>
          //               <th style={{ color: '#052c65' }}>Avg Score</th>
          //             </tr>
          //           </thead>
          //           <tbody>
          //             {stats.course_statistics.map((course) => (
          //               <tr key={course.id}>
          //                 <td>{course.title}</td>
          //                 <td>{course.creator}</td>
          //                 <td>{course.total_subscribers}</td>
          //                 <td>{course.completed_count}</td>
          //                 <td>
          //                   <div className="d-flex align-items-center">
          //                     <div className="progress flex-grow-1 me-2" style={{ height: '6px' }}>
          //                       <div
          //                         className="progress-bar"
          //                         role="progressbar"
          //                         style={{ 
          //                           width: `${course.completion_rate}%`,
          //                           backgroundColor: '#052c65' 
          //                         }}
          //                         aria-valuenow={course.completion_rate}
          //                         aria-valuemin={0}
          //                         aria-valuemax={100}
          //                       ></div>
          //                     </div>
          //                     <span>{course.completion_rate}%</span>
          //                   </div>
          //                 </td>
          //                 <td>
          //                   <span className="badge rounded-pill" style={{ 
          //                     backgroundColor: 'rgba(5, 44, 101, 0.1)', 
          //                     color: '#052c65' 
          //                   }}>
          //                     {course.average_score}
          //                   </span>
          //                 </td>
          //               </tr>
          //             ))}
          //           </tbody>
          //         </table>
          //       </div>
          //     </div>
          //   </div>
          // </div>
        )}

        {activeTab === 'users' && users && (
          <UsersManagement users={users}/>
          // <div>
          //   <div className="card shadow-sm mb-4">
          //     <div className="card-header bg-white">
          //       <h5 style={{ color: '#052c65' }}>User Growth (Monthly)</h5>
          //     </div>
          //     <div className="card-body" style={{ height: '300px' }}>
          //       <Bar
          //         data={{
          //           labels: users.user_growth.labels,
          //           datasets: [
          //             {
          //               label: 'New Users',
          //               data: users.user_growth.data,
          //               backgroundColor: 'rgba(5, 44, 101, 0.7)',
          //             },
          //           ],
          //         }}
          //         options={chartOptions}
          //       />
          //     </div>
          //   </div>

          //   <div className="card shadow-sm">
          //     <div className="card-header bg-white d-flex justify-content-between align-items-center">
          //       <h5 style={{ color: '#052c65', margin: '0' }}>User List ({users.users.length} users)</h5>
          //     </div>
          //     <div className="card-body p-0">
          //       <div className="table-responsive">
          //         <table className="table table-hover m-0">
          //           <thead style={{ backgroundColor: 'rgba(5, 44, 101, 0.1)' }}>
          //             <tr>
          //               <th style={{ color: '#052c65' }}>Username</th>
          //               <th style={{ color: '#052c65' }}>Email</th>
          //               <th style={{ color: '#052c65' }}>Full Name</th>
          //               <th style={{ color: '#052c65' }}>Privilege</th>
          //               <th style={{ color: '#052c65' }}>Joined</th>
          //               <th style={{ color: '#052c65' }}>Courses</th>
          //               <th style={{ color: '#052c65' }}>Subscriptions</th>
          //               <th style={{ color: '#052c65' }}>Status</th>
          //             </tr>
          //           </thead>
          //           <tbody>
          //             {users.users.map((user) => (
          //               <tr key={user.id}>
          //                 <td>{user.username}</td>
          //                 <td>{user.email}</td>
          //                 <td>{user.full_name}</td>
          //                 <td>
          //                   <span className={`badge ${
          //                     user.privilege === 'Admin' ? 'bg-danger' :
          //                     user.privilege === 'Formateur' ? 'bg-warning text-dark' : 'bg-info'
          //                   }`}>
          //                     {user.privilege}
          //                   </span>
          //                 </td>
          //                 <td>{new Date(user.date_joined).toLocaleDateString()}</td>
          //                 <td>{user.course_count}</td>
          //                 <td>{user.subscription_count}</td>
          //                 <td>
          //                   <span className={`badge ${user.is_active ? 'bg-success' : 'bg-secondary'}`}>
          //                     {user.is_active ? 'Active' : 'Inactive'}
          //                   </span>
          //                 </td>
          //               </tr>
          //             ))}
          //           </tbody>
          //         </table>
          //       </div>
          //     </div>
          //   </div>
          // </div>
        )}

        {activeTab === 'courses' && courses && (
          <CoursesManagement courses={courses} />
          // <div>
          //   <div className="card shadow-sm mb-4">
          //     <div className="card-header bg-white">
          //       <h5 style={{ color: '#052c65' }}>Most Popular Courses (by Enrollment)</h5>
          //     </div>
          //     <div className="card-body" style={{ height: '300px' }}>
          //       <Bar
          //         data={{
          //           labels: courses.enrollment_stats.labels.slice(0, 8),
          //           datasets: [
          //             {
          //               label: 'Enrollments',
          //               data: courses.enrollment_stats.data.slice(0, 8),
          //               backgroundColor: 'rgba(5, 44, 101, 0.7)',
          //             },
          //           ],
          //         }}
          //         options={{
          //           ...chartOptions,
          //           indexAxis: 'y' as const,
          //         }}
          //       />
          //     </div>
          //   </div>

          //   <div className="card shadow-sm">
          //     <div className="card-header bg-white d-flex justify-content-between align-items-center">
          //       <h5 style={{ color: '#052c65', margin: '0' }}>All Courses ({courses.courses.length} courses)</h5>
          //     </div>
          //     <div className="card-body p-0">
          //       <div className="table-responsive">
          //         <table className="table table-hover m-0">
          //           <thead style={{ backgroundColor: 'rgba(5, 44, 101, 0.1)' }}>
          //             <tr>
          //               <th style={{ color: '#052c65' }}>Title</th>
          //               <th style={{ color: '#052c65' }}>Creator</th>
          //               <th style={{ color: '#052c65' }}>Subscribers</th>
          //               <th style={{ color: '#052c65' }}>Created</th>
          //               <th style={{ color: '#052c65' }}>Image</th>
          //             </tr>
          //           </thead>
          //           <tbody>
          //             {courses.courses.map((course) => (
          //               <tr key={course.id}>
          //                 <td>{course.title_of_course}</td>
          //                 <td>{course.creator_username}</td>
          //                 <td>
          //                   <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(5, 44, 101, 0.1)', color: '#052c65' }}>
          //                     {course.subscribers_count}
          //                   </span>
          //                 </td>
          //                 <td>{new Date(course.created_at).toLocaleDateString()}</td>
          //                 <td>
          //                   {course.image_url && (
          //                     <img 
          //                       src={course.image_url} 
          //                       alt={course.title_of_course}
          //                       style={{ width: '50px', height: '50px', objectFit: 'cover' }}
          //                       className="rounded"
          //                     />
          //                   )}
          //                 </td>
          //               </tr>
          //             ))}
          //           </tbody>
          //         </table>
          //       </div>
          //     </div>
          //   </div>
          // </div>
        )}

        {activeTab === 'analytics' && analytics && (
          <AnalyticsDashboard analytics={analytics}/>
          // <div>
          //   <div className="row mb-4">
          //     <div className="col-xl-4 col-md-6 mb-3">
          //       <div className="card text-center shadow-sm h-100">
          //         <div className="card-body">
          //           <div className="fs-1">👥</div>
          //           <h5>Active Users (30d)</h5>
          //           <h3 className="text-primary" style={{ color: '#052c65' }}>{analytics.user_engagement.active_users_30d}</h3>
          //         </div>
          //       </div>
          //     </div>
          //     <div className="col-xl-4 col-md-6 mb-3">
          //       <div className="card text-center shadow-sm h-100">
          //         <div className="card-body">
          //           <div className="fs-1">📊</div>
          //           <h5>Engagement Rate</h5>
          //           <h3 className="text-success">{analytics.user_engagement.engagement_rate}%</h3>
          //         </div>
          //       </div>
          //     </div>
          //     <div className="col-xl-4 col-md-6 mb-3">
          //       <div className="card text-center shadow-sm h-100">
          //         <div className="card-body">
          //           <div className="fs-1">🌐</div>
          //           <h5>Total Users</h5>
          //           <h3 className="text-info" style={{ color: '#052c65' }}>{analytics.user_engagement.total_users}</h3>
          //         </div>
          //       </div>
          //     </div>
          //   </div>

          //   <div className="row mb-4">
          //     <div className="col-xl-6 col-lg-12 mb-4">
          //       <div className="card shadow-sm h-100">
          //         <div className="card-header bg-white">
          //           <h5 style={{ color: '#052c65' }}>Progress Distribution</h5>
          //         </div>
          //         <div className="card-body" style={{ height: '300px' }}>
          //           <Pie
          //             data={{
          //               labels: analytics.progress_distribution.map(item => item.range),
          //               datasets: [
          //                 {
          //                   data: analytics.progress_distribution.map(item => item.count),
          //                   backgroundColor: [
          //                     '#052c65',
          //                     '#0d6efd',
          //                     '#3b8ffa',
          //                     '#0dcaf0',
          //                     '#198754',
          //                     '#20c997'
          //                   ],
          //                 },
          //               ],
          //             }}
          //             options={chartOptions}
          //           />
          //         </div>
          //       </div>
          //     </div>

          //     <div className="col-xl-6 col-lg-12 mb-4">
          //       <div className="card shadow-sm h-100">
          //         <div className="card-header bg-white">
          //           <h5 style={{ color: '#052c65' }}>Weekly Activity</h5>
          //         </div>
          //         <div className="card-body" style={{ height: '300px' }}>
          //           <Line
          //             data={{
          //               labels: analytics.weekly_activity.labels,
          //               datasets: [
          //                 {
          //                   label: 'Active Users',
          //                   data: analytics.weekly_activity.data,
          //                   borderColor: '#052c65',
          //                   backgroundColor: 'rgba(5, 44, 101, 0.2)',
          //                   tension: 0.3,
          //                   fill: true,
          //                 },
          //               ],
          //             }}
          //             options={chartOptions}
          //           />
          //         </div>
          //       </div>
          //     </div>
          //   </div>

          //   <div className="card shadow-sm">
          //     <div className="card-header bg-white">
          //       <h5 style={{ color: '#052c65' }}>Course Performance</h5>
          //     </div>
          //     <div className="card-body p-0">
          //       <div className="table-responsive">
          //         <table className="table table-hover m-0">
          //           <thead style={{ backgroundColor: 'rgba(5, 44, 101, 0.1)' }}>
          //             <tr>
          //               <th style={{ color: '#052c65' }}>Course</th>
          //               <th style={{ color: '#052c65' }}>Subscribers</th>
          //               <th style={{ color: '#052c65' }}>Completed</th>
          //               <th style={{ color: '#052c65' }}>Completion Rate</th>
          //               <th style={{ color: '#052c65' }}>Avg Score</th>
          //             </tr>
          //           </thead>
          //           <tbody>
          //             {analytics.course_statistics.map((course) => (
          //               <tr key={course.course_id}>
          //                 <td>{course.course_title}</td>
          //                 <td>{course.total_subscribers}</td>
          //                 <td>{course.completed_count}</td>
          //                 <td>
          //                   <div className="progress" style={{ height: '20px' }}>
          //                     <div
          //                       className="progress-bar"
          //                       role="progressbar"
          //                       style={{ 
          //                         width: `${course.completion_rate}%`,
          //                         backgroundColor: '#052c65'
          //                       }}
          //                       aria-valuenow={course.completion_rate}
          //                       aria-valuemin={0}
          //                       aria-valuemax={100}
          //                     >
          //                       {course.completion_rate}%
          //                     </div>
          //                   </div>
          //                 </td>
          //                 <td>
          //                   <span className="badge rounded-pill" style={{ 
          //                     backgroundColor: 'rgba(5, 44, 101, 0.1)', 
          //                     color: '#052c65' 
          //                   }}>
          //                     {course.average_score}
          //                   </span>
          //                 </td>
          //               </tr>
          //             ))}
          //           </tbody>
          //         </table>
          //       </div>
          //     </div>
          //   </div>
          // </div>
        )}

        {activeTab === 'contents' && contents && (
          <ContentManagement  contents={contents} />
          // <div>
          //   <div className="row mb-4">
          //     <div className="col-xl-6 col-lg-12 mb-4">
          //       <div className="card shadow-sm h-100">
          //         <div className="card-header bg-white">
          //           <h5 style={{ color: '#052c65' }}>Content Type Distribution</h5>
          //         </div>
          //         <div className="card-body" style={{ height: '300px' }}>
          //           <Doughnut
          //             data={{
          //               labels: contents.content_type_stats.map(item => item.content_type__name),
          //               datasets: [
          //                 {
          //                   data: contents.content_type_stats.map(item => item.count),
          //                   backgroundColor: [
          //                     '#052c65',
          //                     '#0d6efd',
          //                     '#3b8ffa',
          //                     '#0dcaf0',
          //                     '#198754'
          //                   ],
          //                 },
          //               ],
          //             }}
          //             options={chartOptions}
          //           />
          //         </div>
          //       </div>
          //     </div>

          //     <div className="col-xl-6 col-lg-12 mb-4">
          //       <div className="card shadow-sm h-100">
          //         <div className="card-header bg-white">
          //           <h5 style={{ color: '#052c65' }}>Most Accessed Content</h5>
          //         </div>
          //         <div className="card-body" style={{ height: '300px' }}>
          //           <Bar
          //             data={{
          //               labels: contents.content_usage.labels.slice(0, 5),
          //               datasets: [
          //                 {
          //                   label: 'QCM Attempts',
          //                   data: contents.content_usage.data.slice(0, 5),
          //                   backgroundColor: 'rgba(5, 44, 101, 0.7)',
          //                 },
          //               ],
          //             }}
          //             options={{
          //               ...chartOptions,
          //               indexAxis: 'y' as const,
          //             }}
          //           />
          //         </div>
          //       </div>
          //     </div>
          //   </div>

          //   <div className="card shadow-sm">
          //     <div className="card-header bg-white d-flex justify-content-between align-items-center">
          //       <h5 style={{ color: '#052c65', margin: '0' }}>All Content Items ({contents.contents.length} items)</h5>
          //     </div>
          //     <div className="card-body p-0">
          //       <div className="table-responsive">
          //         <table className="table table-hover m-0">
          //           <thead style={{ backgroundColor: 'rgba(5, 44, 101, 0.1)' }}>
          //             <tr>
          //               <th style={{ color: '#052c65' }}>Title</th>
          //               <th style={{ color: '#052c65' }}>Course</th>
          //               <th style={{ color: '#052c65' }}>Type</th>
          //               <th style={{ color: '#052c65' }}>Order</th>
          //               <th style={{ color: '#052c65' }}>Created</th>
          //               <th style={{ color: '#052c65' }}>QCM Attempts</th>
          //             </tr>
          //           </thead>
          //           <tbody>
          //             {contents.contents.map((content) => (
          //               <tr key={content.id}>
          //                 <td>{content.title}</td>
          //                 <td>{content.course}</td>
          //                 <td>
          //                   <span className={`badge ${
          //                     content.content_type === 'QCM' ? 'bg-danger' :
          //                     content.content_type === 'Video' ? 'bg-primary' : 'bg-success'
          //                   }`}>
          //                     {content.content_type}
          //                   </span>
          //                 </td>
          //                 <td>{content.order}</td>
          //                 <td>{new Date(content.created_at).toLocaleDateString()}</td>
          //                 <td>
          //                   <span className="badge rounded-pill" style={{ 
          //                     backgroundColor: 'rgba(5, 44, 101, 0.1)', 
          //                     color: '#052c65' 
          //                   }}>
          //                     {content.qcm_attempts}
          //                   </span>
          //                 </td>
          //               </tr>
          //             ))}
          //           </tbody>
          //         </table>
          //       </div>
          //     </div>
          //   </div>
          // </div>
        )}

        {activeTab === 'system' && systemHealth && (
          <SystemHealth systemHealth={systemHealth} />
          // <div>
          //   <div className="row mb-4">
          //     <div className="col-xl-3 col-md-6 mb-3">
          //       <div className="card text-center shadow-sm h-100">
          //         <div className="card-body">
          //           <div className="fs-1">💾</div>
          //           <h5>Database Size</h5>
          //           <h3 className="text-info" style={{ color: '#052c65' }}>{systemHealth.system_metrics.database_size}</h3>
          //         </div>
          //       </div>
          //     </div>
          //     <div className="col-xl-3 col-md-6 mb-3">
          //       <div className="card text-center shadow-sm h-100">
          //         <div className="card-body">
          //           <div className="fs-1">👥</div>
          //           <h5>Active Sessions</h5>
          //           <h3 className="text-primary" style={{ color: '#052c65' }}>{systemHealth.system_metrics.active_sessions}</h3>
          //         </div>
          //       </div>
          //     </div>
          //     <div className="col-xl-3 col-md-6 mb-3">
          //       <div className="card text-center shadow-sm h-100">
          //         <div className="card-body">
          //           <div className="fs-1">⏱️</div>
          //           <h5>Server Uptime</h5>
          //           <h3 className="text-success">{systemHealth.system_metrics.server_uptime}</h3>
          //         </div>
          //       </div>
          //     </div>
          //     <div className="col-xl-3 col-md-6 mb-3">
          //       <div className="card text-center shadow-sm h-100">
          //         <div className="card-body">
          //           <div className="fs-1">⚠️</div>
          //           <h5>Error Rate</h5>
          //           <h3 className="text-warning">{systemHealth.system_metrics.error_rate}</h3>
          //         </div>
          //       </div>
          //     </div>
          //   </div>

          //   <div className="card shadow-sm mb-4">
          //     <div className="card-header bg-white">
          //       <h5 style={{ color: '#052c65' }}>API Performance (Response Time in ms)</h5>
          //     </div>
          //     <div className="card-body" style={{ height: '300px' }}>
          //       <Bar
          //         data={{
          //           labels: systemHealth.performance_stats.labels,
          //           datasets: [
          //             {
          //               label: 'Response Time (ms)',
          //               data: systemHealth.performance_stats.data,
          //               backgroundColor: 'rgba(5, 44, 101, 0.7)',
          //             },
          //           ],
          //         }}
          //         options={chartOptions}
          //       />
          //     </div>
          //   </div>

          //   <div className="card shadow-sm">
          //     <div className="card-header bg-white">
          //       <h5 style={{ color: '#052c65' }}>System Status</h5>
          //     </div>
          //     <div className="card-body">
          //       <div className="row">
          //         <div className="col-xl-4 col-md-6 mb-3">
          //           <div className="alert alert-success d-flex align-items-center">
          //             <span className="fs-4 me-2">✅</span>
          //             <div>
          //               <strong>Database:</strong> Connected
          //             </div>
          //           </div>
          //         </div>
          //         <div className="col-xl-4 col-md-6 mb-3">
          //           <div className="alert alert-success d-flex align-items-center">
          //             <span className="fs-4 me-2">✅</span>
          //             <div>
          //               <strong>Cache:</strong> Active
          //             </div>
          //           </div>
          //         </div>
          //         <div className="col-xl-4 col-md-6 mb-3">
          //           <div className="alert alert-success d-flex align-items-center">
          //             <span className="fs-4 me-2">✅</span>
          //             <div>
          //               <strong>Storage:</strong> Normal
          //             </div>
          //           </div>
          //         </div>
          //       </div>
          //     </div>
          //   </div>
          // </div>
        )}
      </div>

      {showScrollButton && (
        <button 
          className="btn btn-primary rounded-circle position-fixed"
          style={{
            bottom: '20px',
            right: '20px',
            width: '50px',
            height: '50px',
            backgroundColor: '#052c65',
            borderColor: '#052c65',
            zIndex: 1000
          }}
          onClick={scrollToTop}
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default AdminDashboard;