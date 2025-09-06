import React from 'react';
import { Bar } from 'react-chartjs-2';

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

interface SystemHealthProps {
  systemHealth: SystemHealthData;
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
};

const SystemHealth: React.FC<SystemHealthProps> = ({ systemHealth }) => {
  return (
    <div>
                <div className="row mb-4">
                  <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card text-center shadow-sm h-100">
                      <div className="card-body">
                        <div className="fs-1">💾</div>
                        <h5>Database Size</h5>
                        <h3 className="text-info" style={{ color: '#052c65' }}>{systemHealth.system_metrics.database_size}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card text-center shadow-sm h-100">
                      <div className="card-body">
                        <div className="fs-1">👥</div>
                        <h5>Active Sessions</h5>
                        <h3 className="text-primary" style={{ color: '#052c65' }}>{systemHealth.system_metrics.active_sessions}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card text-center shadow-sm h-100">
                      <div className="card-body">
                        <div className="fs-1">⏱️</div>
                        <h5>Server Uptime</h5>
                        <h3 className="text-success">{systemHealth.system_metrics.server_uptime}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card text-center shadow-sm h-100">
                      <div className="card-body">
                        <div className="fs-1">⚠️</div>
                        <h5>Error Rate</h5>
                        <h3 className="text-warning">{systemHealth.system_metrics.error_rate}</h3>
                      </div>
                    </div>
                  </div>
                </div>
    
                <div className="card shadow-sm mb-4">
                  <div className="card-header bg-white">
                    <h5 style={{ color: '#052c65' }}>API Performance (Response Time in ms)</h5>
                  </div>
                  <div className="card-body" style={{ height: '300px' }}>
                    <Bar
                      data={{
                        labels: systemHealth.performance_stats.labels,
                        datasets: [
                          {
                            label: 'Response Time (ms)',
                            data: systemHealth.performance_stats.data,
                            backgroundColor: 'rgba(5, 44, 101, 0.7)',
                          },
                        ],
                      }}
                      options={chartOptions}
                    />
                  </div>
                </div>
    
                <div className="card shadow-sm">
                  <div className="card-header bg-white">
                    <h5 style={{ color: '#052c65' }}>System Status</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-xl-4 col-md-6 mb-3">
                        <div className="alert alert-success d-flex align-items-center">
                          <span className="fs-4 me-2">✅</span>
                          <div>
                            <strong>Database:</strong> Connected
                          </div>
                        </div>
                      </div>
                      <div className="col-xl-4 col-md-6 mb-3">
                        <div className="alert alert-success d-flex align-items-center">
                          <span className="fs-4 me-2">✅</span>
                          <div>
                            <strong>Cache:</strong> Active
                          </div>
                        </div>
                      </div>
                      <div className="col-xl-4 col-md-6 mb-3">
                        <div className="alert alert-success d-flex align-items-center">
                          <span className="fs-4 me-2">✅</span>
                          <div>
                            <strong>Storage:</strong> Normal
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
)};
export default SystemHealth;