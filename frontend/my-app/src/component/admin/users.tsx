import React, { useState, useEffect } from 'react';
import SignUp from '../user/sigUnp';
import api from '../../api/api';

// Add notification types and interfaces
export type NotificationType = "success" | "info" | "warning" | "error";

type NotificationItem = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  duration: number;
};

type NotificationProps = {
  type: NotificationType;
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
};

type NotificationContainerProps = {
  notifications: NotificationItem[];
  removeNotification: (id: number) => void;
};

// Notification Component
const Notification: React.FC<NotificationProps> = ({
  type = "success",
  title,
  message,
  onClose,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => handleClose(), duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const styles: Record<
    NotificationType,
    { titleColor: string; backgroundColor: string; borderColor: string }
  > = {
    success: {
      titleColor: "#10B981",
      backgroundColor: "#1F2937",
      borderColor: "#10B981",
    },
    info: {
      titleColor: "#3B82F6",
      backgroundColor: "#1F2937",
      borderColor: "#3B82F6",
    },
    warning: {
      titleColor: "#F59E0B",
      backgroundColor: "#1F2937",
      borderColor: "#F59E0B",
    },
    error: {
      titleColor: "#EF4444",
      backgroundColor: "#1F2937",
      borderColor: "#EF4444",
    },
  };

  const currentStyle = styles[type];

  return (
    <div
      style={{
        backgroundColor: currentStyle.backgroundColor,
        borderRadius: "12px",
        padding: "20px 24px",
        marginBottom: "16px",
        width: "460px",
        maxWidth: "90vw",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
        borderLeft: `4px solid ${currentStyle.borderColor}`,
        animation: isExiting
          ? "slideOut 0.3s ease-out forwards"
          : "slideIn 0.3s ease-out",
        position: "relative",
      }}
    >
      <div style={{ marginBottom: "8px" }}>
        <span
          style={{
            color: currentStyle.titleColor,
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.5px",
          }}
        >
          {title}
        </span>
        <span style={{ color: "#9CA3AF", fontSize: "14px", margin: "0 8px" }}>
          •
        </span>
        <span style={{ color: "#E5E7EB", fontSize: "13px", fontWeight: 400 }}>
          {type === "success" && "Données enregistrées"}
          {type === "info" && "Quelques informations à vous communiquer"}
          {type === "warning" && "Attention à ce que vous avez fait"}
          {type === "error" && "Informations non enregistrées, réessayer"}
        </span>
      </div>

      <p
        style={{
          color: "#D1D5DB",
          fontSize: "13px",
          lineHeight: "1.6",
          margin: "0 0 16px 0",
        }}
      >
        {message}
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleClose}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "#F97316",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            padding: "4px 8px",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Ok, fermer
        </button>
      </div>
    </div>
  );
};

// Notification Container Component
const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  removeNotification,
}) => (
  <div
    style={{
      position: "fixed",
      bottom: "24px",
      left: "24px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column-reverse",
      gap: "0",
    }}
  >
    {notifications.map((n) => (
      <Notification
        key={n.id}
        type={n.type}
        title={n.title}
        message={n.message}
        duration={n.duration}
        onClose={() => removeNotification(n.id)}
      />
    ))}
  </div>
);

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
  // Add notification state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Add notification functions
  const addNotification = (
    type: NotificationType,
    title: string,
    message: string,
    duration: number = 5000
  ) => {
    const notificationId = Date.now();
    setNotifications((prev) => [
      ...prev,
      { id: notificationId, type, title, message, duration },
    ]);
  };

  const removeNotification = (id: number) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

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
        addNotification("success", "Utilisateurs chargés", `${response.data.users.length} utilisateurs ont été chargés avec succès`, 3000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        addNotification("error", "Erreur de chargement", `Impossible de charger les utilisateurs: ${errorMessage}`, 5000);
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
          addNotification("info", "Détails utilisateur", "Affichage des détails de l'utilisateur", 3000);
          break;
        
        default:
          console.log('Action non reconnue:', action);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      addNotification("error", "Erreur d'action", `Action impossible: ${errorMessage}`, 5000);
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

      addNotification("info", "Modification utilisateur", `Préparation de la modification de ${user.full_name}`, 3000);
    } catch (err) {
      const errorMessage = 'Erreur lors du chargement des données utilisateur';
      setError(errorMessage);
      addNotification("error", "Erreur de chargement", errorMessage, 5000);
      console.error('Error opening edit form:', err);
    }
  };

  const handleEditUser = async (formData: EditUserForm) => {
    try {
      setEditLoading(true);
      setEditError(null);

      addNotification("info", "Mise à jour en cours", "Sauvegarde des modifications de l'utilisateur...", 2000);

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
        addNotification("success", "Utilisateur modifié", `L'utilisateur ${formData.first_name} ${formData.last_name} a été modifié avec succès`, 4000);
      }
    } catch (err: any) {
      let errorMessage = 'Erreur lors de la mise à jour';
      
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
      } else {
        errorMessage = err instanceof Error ? err.message : errorMessage;
      }
      
      setEditError(errorMessage);
      addNotification("error", "Erreur de mise à jour", errorMessage, 5000);
      console.error('Error updating user:', err);
    } finally {
      setEditLoading(false);
    }
  };

  const deleteUser = async (userId: number) => {
    try {
      setLoading(true);
      
      const user = userData?.users.find(u => u.id === userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      addNotification("warning", "Suppression en cours", `Suppression de l'utilisateur ${user.full_name}...`, 3000);

      const response = await api.delete(`/admin/users/${userId}`);
      
      if (response.status === 200) {
        setUserData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            users: prev.users.filter(u => u.id !== userId)
          };
        });

        addNotification("success", "Utilisateur supprimé", `L'utilisateur ${user.full_name} a été supprimé avec succès`, 4000);
      }
    } catch (err) {
      const errorMessage = 'Erreur lors de la suppression de l\'utilisateur';
      setError(errorMessage);
      addNotification("error", "Erreur de suppression", errorMessage, 5000);
      console.error('Error deleting user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewUser = () => {
    setShowSignUp(true);
    addNotification("info", "Nouvel utilisateur", "Création d'un nouvel utilisateur", 3000);
  };

  const handleCloseSignUp = () => {
    setShowSignUp(false);
    setRefresh(prev => !prev);
    addNotification("success", "Retour à la liste", "Retour à la gestion des utilisateurs", 2000);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'status') {
      setStatusFilter(value);
    } else {
      setPrivilegeFilter(value);
    }
    
    if (value !== 'all') {
      addNotification("info", "Filtre appliqué", `Filtre ${filterType} appliqué: ${value}`, 2000);
    }
  };

  const handleExportUsers = () => {
    addNotification("success", "Export réussi", "La liste des utilisateurs a été exportée avec succès", 3000);
  };

  const handleRefreshUsers = () => {
    addNotification("info", "Rafraîchissement", "Mise à jour de la liste des utilisateurs...", 2000);
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
              <button
                onClick={() => deleteUser(user.id)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#DC2626'
                }}
              >
                🗑️ Supprimer
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
      {/* Notification Container */}
      <NotificationContainer 
        notifications={notifications} 
        removeNotification={removeNotification} 
      />

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
            <div style={{ marginBottom: '1rem' }}>
              <button 
                onClick={handleCloseSignUp}
                style={{
                  backgroundColor: '#6B7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '1rem'
                }}
              >
                ← Retour à la liste
              </button>
            </div>
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
                  onChange={(e) => handleFilterChange('status', e.target.value)}
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
                  onChange={(e) => handleFilterChange('privilege', e.target.value)}
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
                
                <div style={{ display: 'flex', gap: '0.5rem', width: isMobile ? '100%' : 'auto' }}>
                  {/* <button
                    style={{
                      backgroundColor: '#10B981',
                      color: 'white',
                      border: 'none',
                      padding: '0.625rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      flex: 1
                    }}
                    onClick={handleRefreshUsers}
                  >
                    🔄
                  </button>
                  <button
                    style={{
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      padding: '0.625rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      flex: 1
                    }}
                    onClick={handleExportUsers}
                  >
                    📤
                  </button> */}
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
                      flex: 2
                    }}
                    onClick={handleNewUser}
                  >
                    + Nouvel utilisateur
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                padding: '0.75rem',
                borderRadius: '6px',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{error}</span>
                <button 
                  onClick={() => setError(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#DC2626',
                    cursor: 'pointer',
                    fontSize: '1.25rem'
                  }}
                >
                  ×
                </button>
              </div>
            )}

            {/* Users Display - Table or Cards based on screen size */}
            {isMobile ? (
              // Mobile Card View
              <div>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#6B7280'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                    <p>Aucun utilisateur trouvé avec les filtres actuels</p>
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setPrivilegeFilter('all');
                        addNotification("info", "Filtres réinitialisés", "Tous les filtres ont été réinitialisés", 2000);
                      }}
                      style={{
                        backgroundColor: '#4338CA',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginTop: '1rem'
                      }}
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Desktop Table View
              <div style={{ overflowX: 'auto' }}>
                {filteredUsers.length > 0 ? (
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
                                <button
                                  onClick={() => deleteUser(user.id)}
                                  style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    textAlign: 'left',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    color: '#DC2626'
                                  }}
                                >
                                  🗑️ Supprimer
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#6B7280'
                  }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
                    <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>Aucun utilisateur trouvé</h3>
                    <p style={{ marginBottom: '1.5rem' }}>Aucun utilisateur ne correspond aux filtres actuels</p>
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setPrivilegeFilter('all');
                        addNotification("info", "Filtres réinitialisés", "Tous les filtres ont été réinitialisés", 2000);
                      }}
                      style={{
                        backgroundColor: '#4338CA',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                )}
              </div>
            )}

            {filteredUsers.length > 0 && (
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
                  onClick={() => addNotification("info", "Chargement", "Chargement des résultats supplémentaires...", 2000)}
                >
                  Afficher plus de résultat
                </button>
              </div>
            )}
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