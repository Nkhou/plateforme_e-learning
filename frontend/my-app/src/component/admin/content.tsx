import React from 'react';
import  { useEffect, useState } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';

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
  // Add notification state
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);

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

  // Add state for content management actions
  const [selectedContent, setSelectedContent] = React.useState<any>(null);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  // Handler for editing content
  const handleEditContent = (content: any) => {
    setSelectedContent(content);
    setShowEditModal(true);
    addNotification("info", "Modification du contenu", `Préparation de la modification du contenu: ${content.title}`, 3000);
  };

  // Handler for deleting content
  const handleDeleteContent = (content: any) => {
    setSelectedContent(content);
    setShowDeleteModal(true);
    addNotification("warning", "Suppression du contenu", `Confirmation requise pour supprimer: ${content.title}`, 5000);
  };

  // Handler for confirming delete
  const confirmDelete = () => {
    if (selectedContent) {
      // Simulate API call for deletion
      setTimeout(() => {
        addNotification("success", "Contenu supprimé", `Le contenu "${selectedContent.title}" a été supprimé avec succès`);
        setShowDeleteModal(false);
        setSelectedContent(null);
      }, 1000);
    }
  };

  // Handler for saving edited content
  const saveContent = () => {
    if (selectedContent) {
      // Simulate API call for update
      setTimeout(() => {
        addNotification("success", "Contenu modifié", `Le contenu "${selectedContent.title}" a été modifié avec succès`);
        setShowEditModal(false);
        setSelectedContent(null);
      }, 1000);
    }
  };

  // Handler for exporting content data
  const handleExportData = () => {
    addNotification("success", "Export réussi", "Les données des contenus ont été exportées avec succès", 3000);
  };

  // Handler for refreshing data
  const handleRefreshData = () => {
    addNotification("info", "Rafraîchissement", "Mise à jour des données des contenus en cours...", 2000);
    // Simulate API call
    setTimeout(() => {
      addNotification("success", "Données mises à jour", "Les données des contenus ont été rafraîchies avec succès");
    }, 1500);
  };

  return (
    <div>
      {/* Notification Container */}
      <NotificationContainer 
        notifications={notifications} 
        removeNotification={removeNotification} 
      />

      {/* Action Buttons */}
      <div className="row mb-3">
        <div className="col-12">
          <div className="d-flex gap-2 justify-content-end">
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={handleRefreshData}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Rafraîchir
            </button>
            <button 
              className="btn btn-outline-success btn-sm"
              onClick={handleExportData}
            >
              <i className="bi bi-download me-1"></i>
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Content Analytics Charts */}
      <div className="row mb-4">
        <div className="col-xl-6 col-lg-12 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 style={{ color: '#052c65' }}>Distribution des types de contenu</h5>
              <button 
                className="btn btn-sm btn-outline-info"
                onClick={() => addNotification("info", "Information graphique", "Ce graphique montre la répartition des différents types de contenu dans votre plateforme")}
              >
                <i className="bi bi-info-circle"></i>
              </button>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              {contents.content_type_stats && contents.content_type_stats.length > 0 ? (
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
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-pie-chart display-4 d-block mb-2"></i>
                  <p>Aucune donnée disponible pour le moment</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-xl-6 col-lg-12 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 style={{ color: '#052c65' }}>Contenus les plus consultés</h5>
              <button 
                className="btn btn-sm btn-outline-info"
                onClick={() => addNotification("info", "Information graphique", "Ce graphique montre les contenus les plus populaires basés sur le nombre de tentatives QCM")}
              >
                <i className="bi bi-info-circle"></i>
              </button>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              {contents.content_usage && contents.content_usage.data && contents.content_usage.data.length > 0 ? (
                <Bar
                  data={{
                    labels: contents.content_usage.labels.slice(0, 5),
                    datasets: [
                      {
                        label: 'Tentatives QCM',
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
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-bar-chart display-4 d-block mb-2"></i>
                  <p>Aucune donnée d'utilisation disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Items Table */}
      <div className="card shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 style={{ color: '#052c65', margin: '0' }}>Tous les contenus ({contents.contents.length} éléments)</h5>
          <div className="d-flex gap-2">
            <span className="badge bg-primary">{contents.contents.filter(c => c.content_type === 'QCM').length} QCM</span>
            <span className="badge bg-success">{contents.contents.filter(c => c.content_type === 'PDF').length} PDF</span>
            <span className="badge bg-info">{contents.contents.filter(c => c.content_type === 'Video').length} Vidéos</span>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover m-0">
              <thead style={{ backgroundColor: 'rgba(5, 44, 101, 0.1)' }}>
                <tr>
                  <th style={{ color: '#052c65' }}>Titre</th>
                  <th style={{ color: '#052c65' }}>Formation</th>
                  <th style={{ color: '#052c65' }}>Type</th>
                  <th style={{ color: '#052c65' }}>Ordre</th>
                  <th style={{ color: '#052c65' }}>Créé le</th>
                  <th style={{ color: '#052c65' }}>Tentatives QCM</th>
                  <th style={{ color: '#052c65' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contents.contents && contents.contents.length > 0 ? (
                  contents.contents.map((content) => (
                    <tr key={content.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {content.content_type === 'QCM' && <i className="bi bi-question-circle text-warning me-2"></i>}
                          {content.content_type === 'Video' && <i className="bi bi-play-circle text-primary me-2"></i>}
                          {content.content_type === 'PDF' && <i className="bi bi-file-earmark-pdf text-danger me-2"></i>}
                          {content.title}
                        </div>
                      </td>
                      <td>{content.course}</td>
                      <td>
                        <span className={`badge ${
                          content.content_type === 'QCM' ? 'bg-warning text-dark' :
                          content.content_type === 'Video' ? 'bg-primary' : 'bg-danger'
                        }`}>
                          {content.content_type}
                        </span>
                      </td>
                      <td>{content.order}</td>
                      <td>{new Date(content.created_at).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <span className="badge rounded-pill" style={{ 
                          backgroundColor: 'rgba(5, 44, 101, 0.1)', 
                          color: '#052c65' 
                        }}>
                          {content.qcm_attempts || 0}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-primary"
                            onClick={() => handleEditContent(content)}
                            title="Modifier"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteContent(content)}
                            title="Supprimer"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                          <button 
                            className="btn btn-outline-info"
                            onClick={() => addNotification("info", "Détails du contenu", `Contenu: ${content.title}\nFormation: ${content.course}\nType: ${content.content_type}`)}
                            title="Voir les détails"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      <i className="bi bi-inbox display-4 d-block mb-2"></i>
                      Aucun contenu disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedContent && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Modifier le contenu</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Modification du contenu: <strong>{selectedContent.title}</strong></p>
                {/* Add your form fields here */}
                <div className="mb-3">
                  <label className="form-label">Titre</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    defaultValue={selectedContent.title}
                    onChange={(e) => setSelectedContent({...selectedContent, title: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Annuler
                </button>
                <button type="button" className="btn btn-primary" onClick={saveContent}>
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedContent && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">Confirmer la suppression</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Êtes-vous sûr de vouloir supprimer le contenu :</p>
                <p><strong>{selectedContent.title}</strong> ?</p>
                <p className="text-muted">Cette action est irréversible.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Annuler
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;