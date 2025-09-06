import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';

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

interface ContentManagementProps {
  contents: ContentData;
}

const ContentManagement: React.FC<ContentManagementProps> = ({ contents }) => {
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
      {/* Content Analytics Charts */}
      <div className="row mb-4">
        <div className="col-xl-6 col-lg-12 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white">
              <h5 style={{ color: '#052c65' }}>Content Type Distribution</h5>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              <Doughnut
                data={{
                  labels: contents.content_type_stats.map(item => item.content_type__name),
                  datasets: [
                    {
                      data: contents.content_type_stats.map(item => item.count),
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

        <div className="col-xl-6 col-lg-12 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white">
              <h5 style={{ color: '#052c65' }}>Most Accessed Content</h5>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              <Bar
                data={{
                  labels: contents.content_usage.labels.slice(0, 5),
                  datasets: [
                    {
                      label: 'QCM Attempts',
                      data: contents.content_usage.data.slice(0, 5),
                      backgroundColor: 'rgba(5, 44, 101, 0.7)',
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

      {/* Content Items Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 style={{ color: '#052c65', margin: '0' }}>All Content Items ({contents.contents.length} items)</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover m-0">
              <thead style={{ backgroundColor: 'rgba(5, 44, 101, 0.1)' }}>
                <tr>
                  <th style={{ color: '#052c65' }}>Title</th>
                  <th style={{ color: '#052c65' }}>Course</th>
                  <th style={{ color: '#052c65' }}>Type</th>
                  <th style={{ color: '#052c65' }}>Order</th>
                  <th style={{ color: '#052c65' }}>Created</th>
                  <th style={{ color: '#052c65' }}>QCM Attempts</th>
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
                      <span className="badge rounded-pill" style={{ 
                        backgroundColor: 'rgba(5, 44, 101, 0.1)', 
                        color: '#052c65' 
                      }}>
                        {content.qcm_attempts}
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

export default ContentManagement;