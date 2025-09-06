import React from 'react';
import { Bar } from 'react-chartjs-2';

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

interface UsersManagementProps {
  users: UserData;
}

const UsersManagement: React.FC<UsersManagementProps> = ({ users }) => {
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
      {/* User Growth Chart */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white">
          <h5 style={{ color: '#052c65' }}>User Growth (Monthly)</h5>
        </div>
        <div className="card-body" style={{ height: '300px' }}>
          <Bar
            data={{
              labels: users.user_growth.labels,
              datasets: [
                {
                  label: 'New Users',
                  data: users.user_growth.data,
                  backgroundColor: 'rgba(5, 44, 101, 0.7)',
                },
              ],
            }}
            options={chartOptions}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 style={{ color: '#052c65', margin: '0' }}>User List ({users.users.length} users)</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover m-0">
              <thead style={{ backgroundColor: 'rgba(5, 44, 101, 0.1)' }}>
                <tr>
                  <th style={{ color: '#052c65' }}>Username</th>
                  <th style={{ color: '#052c65' }}>Email</th>
                  <th style={{ color: '#052c65' }}>Full Name</th>
                  <th style={{ color: '#052c65' }}>Privilege</th>
                  <th style={{ color: '#052c65' }}>Joined</th>
                  <th style={{ color: '#052c65' }}>Courses</th>
                  <th style={{ color: '#052c65' }}>Subscriptions</th>
                  <th style={{ color: '#052c65' }}>Status</th>
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
                        user.privilege === 'Formateur' ? 'bg-warning text-dark' : 'bg-info'
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
  );
};

export default UsersManagement;