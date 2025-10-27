import React, { useState, useEffect } from 'react';
import SignUp from '../user/sigUnp';
import api from '../../api/api';

interface User {
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
}

interface UserData {
  users: Array<User>;
  user_growth: {
    labels: string[];
    data: number[];
  };
}

const UsersManagement: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [privilegeFilter, setPrivilegeFilter] = useState('all');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api('/admin/users'); // Replace with your actual API endpoint
        
      
        setUserData(response.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getPrivilegeColor = (privilege: string) => {
    switch (privilege.toLowerCase()) {
      case 'admin': return '#D97706';
      case 'teacher': return '#F59E0B';
      case 'student': return '#06B6D4';
      default: return '#6B7280';
    }
  };

  const getPrivilegeLabel = (privilege: string) => {
    switch (privilege.toLowerCase()) {
      case 'A': return 'Admin';
      case 'F': return 'Formateur';
      case 'Ap': return 'Apprenant';
      default: return privilege;
    }
  };

  const handleUserAction = (userId: number, action: string) => {
    console.log(`${action} user ${userId}`);
    setOpenMenuId(null);
    // Implement user actions (edit, change status, delete, etc.)
  };

  const handleNewUser = () => {
    setShowSignUp(true);
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <p style={{ color: '#6B7280', fontSize: '1rem' }}>Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#DC2626', fontSize: '1rem' }}>Erreur: {error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              backgroundColor: '#4338CA',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!userData || !userData.users) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <p style={{ color: '#6B7280', fontSize: '1rem' }}>Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  const filteredUsers = userData.users.filter(user => {
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);

    const matchesPrivilege = privilegeFilter === 'all' ||
      user.privilege.toLowerCase() === privilegeFilter.toLowerCase();

    return matchesStatus && matchesPrivilege;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {showSignUp ? <SignUp /> : <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1F2937', margin: 0 }}>
                {filteredUsers.length} utilisateurs ajoutés
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  backgroundColor: '#EEF2FF',
                  border: '1px solid #C7D2FE',
                  borderRadius: '6px',
                  padding: '0.5rem 2rem 0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#4338CA',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%234338CA\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center'
                }}
              >
                <option value="all">Statut &gt; Tous</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>

              {/* Privilege Filter */}
              <select
                value={privilegeFilter}
                onChange={(e) => setPrivilegeFilter(e.target.value)}
                style={{
                  backgroundColor: '#EEF2FF',
                  border: '1px solid #C7D2FE',
                  borderRadius: '6px',
                  padding: '0.5rem 2rem 0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#4338CA',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%234338CA\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center'
                }}
              >
                <option value="all">Privilège &gt; Tous</option>
                <option value="A">Admin</option>
                <option value="F">Formateur</option>
                <option value="Ap">Apprenant</option>
              </select>
              <button
                style={{
                  backgroundColor: '#4338CA',
                  color: 'white',
                  border: 'none',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '6px',
                  fontSize: '0.9375rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3730A3'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4338CA'}
                onClick={handleNewUser}
              >
                + Nouvel utilisateur
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#E5E7EB' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Nom complet</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Email</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Username</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Privilège</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Formations</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Ajouté le</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Subscr.</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>...</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid #E5E7EB',
                      backgroundColor: index % 2 === 0 ? 'white' : '#F9FAFB',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#F9FAFB'}
                  >
                    <td style={{ padding: '0.75rem', color: '#1F2937' }}>{user.full_name}</td>
                    <td style={{ padding: '0.75rem', color: '#6B7280' }}>{user.email}</td>
                    <td style={{ padding: '0.75rem', color: '#6B7280' }}>{user.username}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        backgroundColor: getPrivilegeColor(user.privilege),
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.8125rem',
                        fontWeight: '500'
                      }}>
                        {getPrivilegeLabel(user.privilege)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#1F2937', textAlign: 'center' }}>
                      {user.course_count < 10 ? `0${user.course_count}` : user.course_count}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#6B7280' }}>
                      {new Date(user.date_joined).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#1F2937', textAlign: 'center' }}>
                      {user.subscription_count}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        color: user.is_active ? '#10B981' : '#6B7280',
                        fontWeight: '500'
                      }}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', position: 'relative' }}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6B7280',
                          fontSize: '1.25rem',
                          padding: '0.25rem'
                        }}
                      >
                        ⋯
                      </button>
                      {openMenuId === user.id && (
                        <div style={{
                          position: 'absolute',
                          right: '0',
                          top: '100%',
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          zIndex: 1000,
                          minWidth: '180px',
                          marginTop: '0.25rem'
                        }}>
                          <button
                            onClick={() => handleUserAction(user.id, 'edit')}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            ✏️ Edit utilisateur
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, 'status')}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            🔄 Change status
                          </button>
                          <button
                            onClick={() => handleUserAction(user.id, 'view')}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            👁️ View details
                          </button>
                          <hr style={{ margin: '0.25rem 0', border: 'none', borderTop: '1px solid #E5E7EB' }} />
                          {/* <button
                            onClick={() => handleUserAction(user.id, 'delete')}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#DC2626',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            🗑️ Delete
                          </button> */}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Load More Button */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              style={{
                backgroundColor: '#8B5A3C',
                color: 'white',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '6px',
                fontSize: '0.9375rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#78472A'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8B5A3C'}
            >
              Afficher plus de résultat
            </button>
          </div>
        </>}
      </div>
    </div>
  );
};

export default UsersManagement;