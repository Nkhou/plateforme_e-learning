import React from 'react';
import { Pie, Line } from 'react-chartjs-2';

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

interface AnalyticsDashboardProps {
  analytics: AnalyticsData;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ analytics }) => {
  console.log('Progress distribution+++++++++++++++++++++++++');
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
      {/* Engagement Metrics */}
      <div className="row mb-4">
        <div className="col-xl-4 col-md-6 mb-3">
          <div className="card text-center shadow-sm h-100">
            <div className="card-body">
              <div className="fs-1">👥</div>
              <h5>Active Users (30d)</h5>
              <h3 className="text-primary" style={{ color: '#052c65' }}>{analytics.user_engagement.active_users_30d}</h3>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6 mb-3">
          <div className="card text-center shadow-sm h-100">
            <div className="card-body">
              <div className="fs-1">📊</div>
              <h5>Engagement Rate</h5>
              <h3 className="text-success">{analytics.user_engagement.engagement_rate}%</h3>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6 mb-3">
          <div className="card text-center shadow-sm h-100">
            <div className="card-body">
              <div className="fs-1">🌐</div>
              <h5>Total Users</h5>
              <h3 className="text-info" style={{ color: '#052c65' }}>{analytics.user_engagement.total_users}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row mb-4">
        <div className="col-xl-6 col-lg-12 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white">
              <h5 style={{ color: '#052c65' }}>Progress Distribution</h5>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              <h6 className="mb-3">Total ranges: {analytics.progress_distribution.length}</h6>
              <Pie
                data={{
                  labels: analytics.progress_distribution.map(item => item.range),
                  datasets: [
                    {
                      data: analytics.progress_distribution.map(item => item.count),
                      backgroundColor: [
                        '#052c65',
                        '#0d6efd',
                        '#3b8ffa',
                        '#0dcaf0',
                        '#198754',
                        '#20c997'
                      ],
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
              <h5 style={{ color: '#052c65' }}>Weekly Activity</h5>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              <Line
                data={{
                  labels: analytics.weekly_activity.labels,
                  datasets: [
                    {
                      label: 'Active Users',
                      data: analytics.weekly_activity.data,
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
      </div>

      {/* Course Performance Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-white">
          <h5 style={{ color: '#052c65' }}>Course Performance</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover m-0">
              <thead style={{ backgroundColor: 'rgba(5, 44, 101, 0.1)' }}>
                <tr>
                  <th style={{ color: '#052c65' }}>Course</th>
                  <th style={{ color: '#052c65' }}>Subscribers</th>
                  <th style={{ color: '#052c65' }}>Completed</th>
                  <th style={{ color: '#052c65' }}>Completion Rate</th>
                  <th style={{ color: '#052c65' }}>Avg Score</th>
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
                          style={{ 
                            width: `${course.completion_rate}%`,
                            backgroundColor: '#052c65'
                          }}
                          aria-valuenow={course.completion_rate}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          {course.completion_rate}%
                        </div>
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

export default AnalyticsDashboard;