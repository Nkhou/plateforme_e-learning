import React from 'react';
import { Line, Doughnut } from 'react-chartjs-2';

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

interface OverviewStatisticsProps {
  stats: AdminStats;
}

const OverviewStatistics: React.FC<OverviewStatisticsProps> = ({ stats }) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="row mb-4">
        {[
          { title: 'Total Users', value: stats.overview.total_users, icon: '👥' },
          { title: 'Total Courses', value: stats.overview.total_courses, icon: '📚' },
          { title: 'Active Subscriptions', value: stats.overview.active_subscriptions, icon: '🔔' },
          { title: 'New Users (7d)', value: stats.overview.recent_users, icon: '🆕' },
        ].map((item, index) => (
          <div key={index} className="col-xl-3 col-md-6 mb-3">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body text-center p-3">
                <div className="fs-1 mb-2">{item.icon}</div>
                <h5 className="card-title text-muted">{item.title}</h5>
                <h2 className="card-text fw-bold" style={{ color: '#052c65' }}>{item.value}</h2>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row">
        <div className="col-xl-6 col-lg-12 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white">
              <h5 className="m-0" style={{ color: '#052c65' }}>User Registration (Last 30 Days)</h5>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              <Line
                data={{
                  labels: stats.user_registration_chart.labels,
                  datasets: [
                    {
                      label: 'New Users',
                      data: stats.user_registration_chart.data,
                      borderColor: '#052c65',
                      backgroundColor: 'rgba(5, 44, 101, 0.2)',
                      tension: 0.3,
                      fill: true,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </div>
        </div>

        <div className="col-xl-6 col-lg-12 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white">
              <h5 className="m-0" style={{ color: '#052c65' }}>User Distribution by Privilege</h5>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              <Doughnut
                data={{
                  labels: stats.user_distribution.map(item => item.privilege),
                  datasets: [
                    {
                      data: stats.user_distribution.map(item => item.count),
                      backgroundColor: [
                        '#052c65',
                        '#0d6efd',
                        '#3b8ffa',
                        '#0dcaf0',
                        '#198754'
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

      {/* Course Statistics Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <h5 className="m-0" style={{ color: '#052c65' }}>Course Statistics</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover m-0">
              <thead style={{ backgroundColor: 'rgba(5, 44, 101, 0.1)' }}>
                <tr>
                  <th style={{ color: '#052c65' }}>Course</th>
                  <th style={{ color: '#052c65' }}>Creator</th>
                  <th style={{ color: '#052c65' }}>Subscribers</th>
                  <th style={{ color: '#052c65' }}>Completed</th>
                  <th style={{ color: '#052c65' }}>Completion Rate</th>
                  <th style={{ color: '#052c65' }}>Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {stats.course_statistics.map((course) => (
                  <tr key={course.id}>
                    <td>{course.title}</td>
                    <td>{course.creator}</td>
                    <td>{course.total_subscribers}</td>
                    <td>{course.completed_count}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="progress flex-grow-1 me-2" style={{ height: '6px' }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{ 
                              width: `${course.completion_rate}%`,
                              backgroundColor: '#052c65' 
                            }}
                            aria-valuenow={course.completion_rate}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          ></div>
                        </div>
                        <span>{course.completion_rate}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge rounded-pill" style={{ 
                        backgroundColor: 'rgba(5, 44, 101, 0.1)', 
                        color: '#052c65' 
                      }}>
                        {course.average_score}
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
  );
};

export default OverviewStatistics;