import React, { useState, useEffect } from 'react';
import SignUp from '../user/sigUnp';
import api from '../../api/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  privilege: string;
  date_joined: string;
  last_login: string;
  is_active: boolean;
  course_count: number;
  subscription_count: number;
  status: number; // 1: Actif, 2: Suspendu
}

interface UserData {
  users: Array<User>;
  user_growth: {
    labels: string[];
    data: number[];
  };
}

// Interface pour le formulaire d'édition
interface EditUserForm {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  privilege: string;
  status: number;
}

const UsersManagement: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [privilegeFilter, setPrivilegeFilter] = useState('all');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [refresh, setRefresh] = useState(false);
  
  // États pour l'édition
  const [editingUser, setEditingUser] = useState<EditUserForm | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size and handle resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkScreenSize();

    // Add event listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await api('/admin/users');
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
  }, [refresh]);

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

  const getStatusLabel = (status: number) => {
    return status === 1 ? 'Actif' : 'Suspendu';
  };

  const getStatusColor = (status: number) => {
    return status === 1 ? '#10B981' : '#6B7280';
  };

  const handleUserAction = async (userId: number, action: string) => {
    try {
      switch (action) {
        case 'edit':
          await openEditUser(userId);
          break;
        
        case 'status':
          await openEditUser(userId);
          break;
        
        case 'view':
          console.log('View user details:', userId);
          break;
        
        default:
          console.log('Action non reconnue:', action);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      console.error('Error performing user action:', err);
    } finally {
      setOpenMenuId(null);
    }
  };

  const openEditUser = async (userId: number) => {
    try {
      const user = userData?.users.find(u => u.id === userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      let first_name = user.first_name;
      let last_name = user.last_name;
      
      if ((!first_name || !last_name) && user.full_name) {
        const nameParts = user.full_name.split(' ');
        if (nameParts.length >= 2) {
          first_name = nameParts[0] || '';
          last_name = nameParts.slice(1).join(' ') || '';
        }
      }

      setEditingUser({
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: first_name || '',
        last_name: last_name || '',
        privilege: user.privilege,
        status: user.status
      });
    } catch (err) {
      setError('Erreur lors du chargement des données utilisateur');
      console.error('Error opening edit form:', err);
    }
  };

  const handleEditUser = async (formData: EditUserForm) => {
    try {
      setEditLoading(true);
      setEditError(null);

      const response = await api.patch(`/admin/users/${formData.id}/update-status/`, {
        status: formData.status,
        privilege: formData.privilege,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email
      });

      if (response.status === 200) {
        setUserData(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            users: prev.users.map(u => 
              u.id === formData.id 
                ? { 
                    ...u, 
                    status: formData.status,
                    privilege: formData.privilege,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    full_name: `${formData.first_name} ${formData.last_name}`,
                    email: formData.email,
                    is_active: formData.status === 1
                  }
                : u
            )
          };
        });

        setEditingUser(null);
        setRefresh(prev => !prev);
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setEditError(err.response.data.error);
      } else {
        setEditError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      }
      console.error('Error updating user:', err);
    } finally {
      setEditLoading(false);
    }
  };

  const deleteUser = async (userId: number) => {
    try {
      setLoading(true);
      
      const response = await api.delete(`/admin/users/${userId}`);
      
      if (response.status === 200) {
        setUserData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            users: prev.users.filter(u => u.id !== userId)
          };
        });
      }
    } catch (err) {
      setError('Erreur lors de la suppression de l\'utilisateur');
      console.error('Error deleting user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewUser = () => {
    setShowSignUp(true);
  };

  const handleCloseSignUp = () => {
    setShowSignUp(false);
    setRefresh(prev => !prev);
  };

  // Loading state
  if (loading && !userData) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;
  }

  // Error state
  if (error && !userData) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#DC2626' }}>Erreur: {error}</p>
          <button onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!userData || !userData.users) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Aucune donnée disponible</div>;
  }

  const filteredUsers = userData.users.filter(user => {
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.status === 1) ||
      (statusFilter === 'inactive' && user.status === 2);

    const matchesPrivilege = privilegeFilter === 'all' ||
      user.privilege.toLowerCase() === privilegeFilter.toLowerCase();

    return matchesStatus && matchesPrivilege;
  });

  // Mobile Card View Component
  const UserCard = ({ user }: { user: User }) => (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '0.75rem',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <h3 style={{ fontWeight: '600', color: '#1F2937', margin: '0 0 0.25rem 0' }}>
            {user.full_name}
          </h3>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>
            {user.email}
          </p>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>
            @{user.username}
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              fontSize: '1.25rem',
              padding: '0.25rem',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
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
              minWidth: '180px'
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
                  color: '#374151'
                }}
              >
                ✏️ Modifier utilisateur
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
                  color: '#374151'
                }}
              >
                🔄 Changer statut
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '0.5rem',
        fontSize: '0.875rem'
      }}>
        <div>
          <span style={{ color: '#6B7280' }}>Privilège:</span>
          <span style={{
            backgroundColor: getPrivilegeColor(user.privilege),
            color: 'white',
            padding: '0.125rem 0.5rem',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: '500',
            marginLeft: '0.5rem'
          }}>
            {getPrivilegeLabel(user.privilege)}
          </span>
        </div>
        
        <div>
          <span style={{ color: '#6B7280' }}>Statut:</span>
          <span style={{
            color: getStatusColor(user.status),
            fontWeight: '500',
            marginLeft: '0.5rem'
          }}>
            {getStatusLabel(user.status)}
          </span>
        </div>

        <div>
          <span style={{ color: '#6B7280' }}>Formations:</span>
          <span style={{ fontWeight: '500', marginLeft: '0.5rem' }}>
            {user.course_count < 10 ? `0${user.course_count}` : user.course_count}
          </span>
        </div>

        <div>
          <span style={{ color: '#6B7280' }}>Subscriptions:</span>
          <span style={{ fontWeight: '500', marginLeft: '0.5rem' }}>
            {user.subscription_count}
          </span>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <span style={{ color: '#6B7280' }}>Ajouté le:</span>
          <span style={{ marginLeft: '0.5rem' }}>
            {new Date(user.date_joined).toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            })}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ 
      padding: isMobile ? '1rem' : '2rem', 
      maxWidth: '1400px', 
      margin: '0 auto' 
    }}>
      {/* Formulaire d'édition */}
      {editingUser && (
        <EditUserForm
          user={editingUser}
          onSave={handleEditUser}
          onCancel={() => setEditingUser(null)}
          loading={editLoading}
          error={editError}
          isMobile={isMobile}
        />
      )}

      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        padding: isMobile ? '1rem' : '1.5rem', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
      }}>
        {showSignUp ? (
          <div>
            <button onClick={handleCloseSignUp}>
              ← Retour à la liste
            </button>
            <SignUp />
          </div>
        ) : (
          <>
            {/* Header - Responsive Layout */}
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between', 
              alignItems: isMobile ? 'stretch' : 'center', 
              marginBottom: '1.5rem', 
              gap: '1rem' 
            }}>
              <h2 style={{ 
                fontSize: isMobile ? '1.125rem' : '1.25rem', 
                fontWeight: '600', 
                color: '#1F2937', 
                margin: 0,
                textAlign: isMobile ? 'center' : 'left'
              }}>
                {filteredUsers.length} utilisateurs ajoutés
              </h2>

              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                gap: '0.75rem',
                width: isMobile ? '100%' : 'auto'
              }}>
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
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  <option value="all">Statut &gt; Tous</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Suspendu</option>
                </select>

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
                    width: isMobile ? '100%' : 'auto'
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
                    width: isMobile ? '100%' : 'auto'
                  }}
                  onClick={handleNewUser}
                >
                  + Nouvel utilisateur
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                padding: '0.75rem',
                borderRadius: '6px',
                marginBottom: '1rem'
              }}>
                {error}
                <button onClick={() => setError(null)}>×</button>
              </div>
            )}

            {/* Users Display - Table or Cards based on screen size */}
            {isMobile ? (
              // Mobile Card View
              <div>
                {filteredUsers.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              // Desktop Table View
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
                          backgroundColor: index % 2 === 0 ? 'white' : '#F9FAFB'
                        }}
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
                            color: getStatusColor(user.status),
                            fontWeight: '500'
                          }}>
                            {getStatusLabel(user.status)}
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
                              minWidth: '180px'
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
                                  color: '#374151'
                                }}
                              >
                                ✏️ Modifier utilisateur
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
                                  color: '#374151'
                                }}
                              >
                                🔄 Changer statut
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                style={{
                  backgroundColor: '#8B5A3C',
                  color: 'white',
                  border: 'none',
                  padding: isMobile ? '0.875rem 1.5rem' : '0.75rem 2rem',
                  borderRadius: '6px',
                  fontSize: '0.9375rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                Afficher plus de résultat
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Composant pour le formulaire d'édition avec responsive support
interface EditUserFormProps {
  user: EditUserForm;
  onSave: (user: EditUserForm) => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
  isMobile: boolean;
}

const EditUserForm: React.FC<EditUserFormProps> = ({ user, onSave, onCancel, loading, error, isMobile }) => {
  const [formData, setFormData] = useState<EditUserForm>(user);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: keyof EditUserForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: isMobile ? '1.5rem' : '2rem',
        width: '100%',
        maxWidth: '500px',
        maxHeight: isMobile ? '85vh' : '90vh',
        overflow: 'auto'
      }}>
        <h3 style={{ 
          marginBottom: '1.5rem', 
          fontSize: isMobile ? '1.125rem' : '1.25rem', 
          fontWeight: '600' 
        }}>
          Modifier l'utilisateur
        </h3>

        {error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            padding: '0.75rem',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Prénom *
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Nom *
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem',
                backgroundColor: '#F3F4F6',
                color: '#6B7280'
              }}
              disabled
            />
            <small style={{ color: '#6B7280', fontSize: '0.75rem' }}>
              Le username ne peut pas être modifié
            </small>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Privilège
            </label>
            <select
              value={formData.privilege}
              onChange={(e) => handleChange('privilege', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="A">Admin</option>
              <option value="F">Formateur</option>
              <option value="Ap">Apprenant</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value={1}>Actif</option>
              <option value={2}>Suspendu</option>
            </select>
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: '0.75rem', 
            justifyContent: 'flex-end' 
          }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                width: isMobile ? '100%' : 'auto'
              }}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#4338CA',
                color: 'white',
                cursor: 'pointer',
                width: isMobile ? '100%' : 'auto'
              }}
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsersManagement;