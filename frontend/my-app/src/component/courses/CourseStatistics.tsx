// CourseStatistics.tsx
import React, { useEffect, useState } from 'react';
import api from '../../api/api';

interface CourseStatisticsProps {
  courseId: number;
}

interface StatisticsData {
  course: {
    id: number;
    title: string;
    creator: string;
    created_at: string;
  };
  subscriptions: {
    total: number;
    active: number;
    inactive: number;
    completion_rate: number;
  };
  progress: {
    average: number;
    maximum: number;
    minimum: number;
    completed: number;
  };
  scores: {
    average: number;
    maximum: number;
    minimum: number;
  };
  qcm_performance: {
    average_attempts: number;
    average_score: number;
    pass_rate: number;
  };
  activity: {
    recent_activity: number;
    enrollment_trend: Array<{month: string; count: number}>;
  };
}

const CourseStatistics: React.FC<CourseStatisticsProps> = ({ courseId }) => {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const response = await api.get(`courses/${courseId}/statistics/`);
        setStatistics(response.data);
        console.log('Statistics( +++++++++++++++++++++++++', statistics)
      } catch (err) {
        setError('Failed to load statistics');
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [courseId]);

  if (loading) return <div className="text-center">Loading statistics...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!statistics) return <div>No statistics available</div>;

  return (
    <div className="container mt-4">
      <h3>Course Statistics: {statistics.course.title}</h3>
      
      {/* Subscription Stats */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">{statistics.subscriptions.total}</h5>
              <p className="card-text">Total Subscriptions</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">{statistics.subscriptions.active}</h5>
              <p className="card-text">Active Learners</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">{statistics.subscriptions.completion_rate.toFixed(1)}%</h5>
              <p className="card-text">Completion Rate</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">{statistics.progress.completed}</h5>
              <p className="card-text">Completed Course</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h6>Progress Statistics</h6>
            </div>
            <div className="card-body">
              <p>Average Progress: <strong>{statistics.progress.average.toFixed(1)}%</strong></p>
              <p>Max Progress: <strong>{statistics.progress.maximum.toFixed(1)}%</strong></p>
              <p>Min Progress: <strong>{statistics.progress.minimum.toFixed(1)}%</strong></p>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h6>Score Statistics</h6>
            </div>
            <div className="card-body">
              <p>Average Score: <strong>{statistics.scores.average.toFixed(1)}</strong></p>
              <p>Max Score: <strong>{statistics.scores.maximum.toFixed(1)}</strong></p>
              <p>Min Score: <strong>{statistics.scores.minimum.toFixed(1)}</strong></p>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h6>QCM Performance</h6>
            </div>
            <div className="card-body">
              <p>Average Attempts: <strong>{statistics.qcm_performance.average_attempts.toFixed(1)}</strong></p>
              <p>Average Score: <strong>{statistics.qcm_performance.average_score.toFixed(1)}%</strong></p>
              <p>Pass Rate: <strong>{statistics.qcm_performance.pass_rate.toFixed(1)}%</strong></p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="card mb-4">
        <div className="card-header">
          <h6>Recent Activity</h6>
        </div>
        <div className="card-body">
          <p>Active learners in last 7 days: <strong>{statistics.activity.recent_activity}</strong></p>
          <h6>Enrollment Trend:</h6>
          <ul>
            {statistics.activity.enrollment_trend.map((trend, index) => (
              <li key={index}>
                {new Date(trend.month).toLocaleDateString()}: {trend.count} enrollments
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CourseStatistics;