import React from 'react';
import { Bar } from 'react-chartjs-2';

interface CourseData {
  courses: Array<any>;
  enrollment_stats: {
    labels: string[];
    data: number[];
  };
}

interface CoursesManagementProps {
  courses: CourseData;
}

const CoursesManagement: React.FC<CoursesManagementProps> = ({ courses }) => {
  console.log('llllllllllll', courses )
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  // Add defensive checks for enrollment_stats
  const hasEnrollmentStats = courses?.enrollment_stats?.labels && courses?.enrollment_stats?.data;
  const enrollmentLabels = hasEnrollmentStats ? courses.enrollment_stats.labels.slice(0, 8) : [];
  const enrollmentData = hasEnrollmentStats ? courses.enrollment_stats.data.slice(0, 8) : [];

  return (
    <div>
      {/* Popular Courses Chart */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white">
          <h5 style={{ color: '#052c65' }}>Most Popular Courses (by Enrollment)</h5>
        </div>
        <div className="card-body" style={{ height: '300px' }}>
          {hasEnrollmentStats && enrollmentLabels.length > 0 ? (
            <Bar
              data={{
                labels: enrollmentLabels,
                datasets: [
                  {
                    label: 'Enrollments',
                    data: enrollmentData,
                    backgroundColor: 'rgba(5, 44, 101, 0.7)',
                  },
                ],
              }}
              options={{
                ...chartOptions,
                indexAxis: 'y' as const,
              }}
            />
          ) : (
            <div className="d-flex justify-content-center align-items-center h-100">
              <p className="text-muted">No enrollment data available</p>
            </div>
          )}
        </div>
      </div>

      {/* All Courses Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 style={{ color: '#052c65', margin: '0' }}>
            All Courses ({courses?.courses?.length || 0} courses)
          </h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover m-0">
              <thead style={{ backgroundColor: 'rgba(5, 44, 101, 0.1)' }}>
                <tr>
                  <th style={{ color: '#052c65' }}>Title</th>
                  <th style={{ color: '#052c65' }}>Creator</th>
                  <th style={{ color: '#052c65' }}>Subscribers</th>
                  <th style={{ color: '#052c65' }}>Created</th>
                  <th style={{ color: '#052c65' }}>Image</th>
                </tr>
              </thead>
              <tbody>
                {courses?.courses?.map((course) => (
                  <tr key={course.id}>
                    <td>{course.title_of_course}</td>
                    <td>{course.creator_username}</td>
                    <td>
                      <span className="badge rounded-pill" style={{
                        backgroundColor: 'rgba(5, 44, 101, 0.1)',
                        color: '#052c65'
                      }}>
                        {course.subscribers_count}
                      </span>
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
  );
};

export default CoursesManagement;