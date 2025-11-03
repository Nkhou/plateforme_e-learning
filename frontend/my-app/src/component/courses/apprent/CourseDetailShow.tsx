import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api/api';

interface VideoContent {
  video_file: string;
  duration?: number;
}

interface PDFContent {
  pdf_file: string;
  page_count?: number;
}

interface QCMOption {
  id: number;
  text: string;
  is_correct: boolean;
}

interface QCMQuestion {
  id: number;
  question: string;
  options: QCMOption[];
}

interface QCM {
  id: number;
  title: string;
  questions: QCMQuestion[];
}

interface Content {
  id: number;
  title: string;
  content_type: string;
  caption?: string;
  order: number;
  status: number;
  estimated_duration?: number;
  min_required_time?: number;
  video_content?: VideoContent;
  pdf_content?: PDFContent;
  qcm?: QCM;
  video_url?: string;
  is_completed?: boolean;
  progress?: number;
}

interface Module {
  id: number;
  title: string;
  description?: string;
  order: number;
  status: number;
  contents: Content[];
}

interface Course {
  id: number;
  title_of_course: string;
  description: string;
  image?: string;
  status: number;
  department?: string;
  category?: string;
  creator?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  creator_username?: string;
  created_at: string;
  updated_at: string;
  estimated_duration?: number;
  min_required_time?: number;
  modules: Module[];
}

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await api.get(`courses/${id}/`);
        console.log('course needed', response.data);
        setCourse(response.data);
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  useEffect(() => {
    if (showModal && selectedContent) {
      const interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      setTimeSpent(0);
    }
  }, [showModal, selectedContent]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const getContentIcon = (contentType: string) => {
    if (!contentType) return '📌';
    switch (contentType.toLowerCase()) {
      case 'video':
        return '🎥';
      case 'pdf':
        return '📄';
      case 'qcm':
        return '📝';
      default:
        return '📌';
    }
  };

  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return { text: 'Actif', color: '#10B981' };
    }
    return { text: 'Inactif', color: '#6B7280' };
  };

  const handleContentClick = (content: Content) => {
    setSelectedContent(content);
    setShowModal(true);
    setTimeSpent(0);
  };

  const handleMarkAsCompleted = async () => {
    if (selectedContent) {
      try {
        await api.patch(`contents/${selectedContent.id}/complete/`);
        alert('Contenu marqué comme terminé');
        setShowModal(false);
        setSelectedContent(null);
        const response = await api.get(`courses/${id}/`);
        setCourse(response.data);
      } catch (error) {
        console.error('Error marking content as completed:', error);
        alert('Erreur lors de la mise à jour');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedContent(null);
  };

  const getVideoUrl = (content: Content) => {
    if (content.video_url) {
      if (content.video_url.startsWith('http')) {
        return content.video_url;
      }
      return `${window.location.protocol}//${window.location.hostname}:8000${content.video_url}`;
    }
    return null;
  };

  const getPdfUrl = (content: Content) => {
    if (content.pdf_content?.pdf_file) {
      const pdfPath = content.pdf_content.pdf_file;
      if (pdfPath.startsWith('http')) {
        return pdfPath;
      }
      return `${window.location.protocol}//${window.location.hostname}:8000${pdfPath}`;
    }
    return null;
  };

  const getFileName = (content: Content): string => {
    if (content.pdf_content?.pdf_file) {
      const parts = content.pdf_content.pdf_file.split('/');
      return parts[parts.length - 1] || 'nom_du_fichier.pdf';
    } else if (content.video_content?.video_file) {
      const parts = content.video_content.video_file.split('/');
      return parts[parts.length - 1] || 'nom_du_fichier.mp4';
    }
    return 'nom_du_fichier';
  };

  const getFileSize = (content: Content): string => {
    if (content.content_type?.toLowerCase() === 'pdf') {
      return '15MB';
    } else if (content.content_type?.toLowerCase() === 'video') {
      return '26.8MB';
    }
    return '';
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        backgroundColor: '#F3F4F6',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ color: '#374151', fontSize: '1.5rem' }}>⏳ Chargement...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={{ 
        backgroundColor: '#F3F4F6',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ color: '#374151', fontSize: '1.5rem' }}>Formation non trouvée</div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(course.status);

  return (
    <div style={{ backgroundColor: '#F3F4F6', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#2D2B6B', color: 'white', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>{course.title_of_course}</h1>
          <span style={{ 
            backgroundColor: statusBadge.color, 
            color: 'white', 
            padding: '0.25rem 0.75rem', 
            borderRadius: '12px', 
            fontSize: '0.75rem'
          }}>
            {statusBadge.text}
          </span>
        </div>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.9 }}>{course.description}</p>
      </div>

      {/* Stats Bar */}
      <div style={{ backgroundColor: '#2D2B6B', padding: '0 2rem 2rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '2rem', color: 'white' }}>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Contenu total</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {course.modules?.reduce((total, module) => total + (module.contents?.length || 0), 0).toString().padStart(2, '0') || '00'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>N° de modules</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>0{course.modules?.length || 0}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>N° d'apprenants</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>0</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Avg. du progrès</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>0%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Votre progrès</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>0%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Temps estimé</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{formatDuration(course.estimated_duration) || '0min'}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '2rem', display: 'flex', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Left Sidebar */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <div style={{ 
            backgroundColor: '#E5E7EB', 
            borderRadius: '8px', 
            height: '200px', 
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {course.image ? (
              <img src={course.image} alt="Course" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
                <div style={{ fontSize: '3rem' }}>📚</div>
                <div style={{ fontSize: '0.875rem' }}>Course Image</div>
              </div>
            )}
          </div>

          {(course.department || course.category) && (
            <div style={{ 
              backgroundColor: '#FED7AA', 
              color: '#9A3412', 
              padding: '0.5rem 1rem', 
              borderRadius: '20px', 
              fontSize: '0.875rem',
              display: 'inline-block',
              marginBottom: '1rem'
            }}>
              {course.department || course.category}
            </div>
          )}

          <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: '1.6', marginBottom: '1rem' }}>
            {course.description}
          </p>

          <div style={{ marginBottom: '0.5rem' }}>
            <span>👤 </span>
            <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Créée par</span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '1rem' }}>
            {course.creator?.username || course.creator_username || 'Inconnu'}
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <span>📅 </span>
            <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Créée le</span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
            {formatDate(course.created_at)}
          </div>
        </div>

        {/* Right Content - Modules */}
        <div style={{ flex: 1 }}>
          {/* <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1.5rem' }}>
            <button 
              style={{
                backgroundColor: '#2D2B6B',
                color: 'white',
                border: 'none',
                padding: '0.625rem 1.25rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              ➕ Nouveau module
            </button>
          </div> */}

          {course.modules && course.modules.length > 0 ? (
            course.modules.map((module) => (
              <div key={module.id} style={{ marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      Module {module.order} • {module.title}
                    </h3>
                    {/* <button 
                      style={{ color: '#2D2B6B', cursor: 'pointer', background: 'none', border: 'none', fontSize: '0.875rem', fontWeight: '500', padding: 0 }}
                    >
                      + nouveau contenu
                    </button> */}
                  </div>

                  {module.contents && module.contents.length > 0 ? (
                    module.contents.map((content) => (
                      <div 
                        key={content.id}
                        onClick={() => handleContentClick(content)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem',
                          backgroundColor: '#F9FAFB',
                          borderRadius: '6px',
                          marginBottom: '0.5rem',
                          border: '1px solid #E5E7EB',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#EEF2FF';
                          e.currentTarget.style.borderColor = '#2D2B6B';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#F9FAFB';
                          e.currentTarget.style.borderColor = '#E5E7EB';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                          <span>{getContentIcon(content.content_type)}</span>
                          <span style={{ fontSize: '0.875rem', color: '#1F2937' }}>{content.title}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          {content.estimated_duration && (
                            <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                              {formatDuration(content.estimated_duration)}
                            </span>
                          )}
                          {content.is_completed && (
                            <span style={{ fontSize: '0.875rem', color: '#10B981', fontWeight: '500' }}>
                              ✓ Complété
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#6B7280', fontSize: '0.875rem' }}>
                      Aucun contenu dans ce module
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '2rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
              <div style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>Aucun module trouvé</div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Cette formation ne contient pas encore de modules.</div>
            </div>
          )}
        </div>
      </div>

      {/* Content Viewer Modal */}
      {showModal && selectedContent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{getContentIcon(selectedContent.content_type)}</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>{selectedContent.title}</h3>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                Module {course.modules.find(m => m.contents.some(c => c.id === selectedContent.id))?.order} • {course.modules.find(m => m.contents.some(c => c.id === selectedContent.id))?.title}
              </div>
            </div>

            {/* Time Required Banner */}
            {selectedContent.min_required_time && (
              <div style={{ 
                backgroundColor: '#FEF3C7', 
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #E5E7EB'
              }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400E' }}>
                  <strong>Temps requis :</strong> Vous devez passer {selectedContent.min_required_time} minutes ou plus dans ce cours avant de pouvoir marquer le contenu comme terminé.
                </p>
              </div>
            )}

            {/* Content Description */}
            {selectedContent.caption && (
              <div style={{ padding: '1rem 1.5rem', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>À propos du contenu</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280', lineHeight: '1.5' }}>{selectedContent.caption}</p>
              </div>
            )}

            {/* Timer Display */}
            <div style={{ 
              padding: '0.75rem 1.5rem',
              backgroundColor: '#EEF2FF',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>⏱️</span>
                <span style={{ fontSize: '0.875rem', color: '#4338CA', fontWeight: '500' }}>
                  Temps estimé de lecture : {selectedContent.estimated_duration || 15}min
                </span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#4338CA' }}>
                {formatTime(timeSpent)} / {formatTime((selectedContent.estimated_duration || 15) * 60)}
              </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem' }}>Contenu à lire</h4>

              {/* PDF Content */}
              {selectedContent.content_type?.toLowerCase() === 'pdf' && (
                <div>
                  {getPdfUrl(selectedContent) ? (
                    <iframe 
                      src={getPdfUrl(selectedContent)!}
                      style={{
                        width: '100%',
                        height: '500px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        backgroundColor: '#000'
                      }}
                      title={selectedContent.title}
                    />
                  ) : (
                    <div style={{
                      backgroundColor: '#F3F4F6',
                      borderRadius: '8px',
                      padding: '3rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                      <div style={{ color: '#6B7280' }}>Document PDF non disponible</div>
                    </div>
                  )}
                </div>
              )}

              {/* Video Content */}
              {selectedContent.content_type?.toLowerCase() === 'video' && (
                <div>
                  {getVideoUrl(selectedContent) ? (
                    <video 
                      controls
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '500px',
                        backgroundColor: '#000',
                        borderRadius: '6px'
                      }}
                    >
                      <source src={getVideoUrl(selectedContent)!} type="video/mp4" />
                      Votre navigateur ne supporte pas la lecture de vidéos.
                    </video>
                  ) : (
                    <div style={{
                      backgroundColor: '#1F2937',
                      borderRadius: '8px',
                      padding: '3rem',
                      textAlign: 'center',
                      color: 'white'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎥</div>
                      <div>Vidéo non disponible</div>
                    </div>
                  )}
                </div>
              )}

              {/* QCM Content */}
              {selectedContent.content_type?.toLowerCase() === 'qcm' && selectedContent.qcm && (
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB'
                }}>
                  <h5 style={{ marginBottom: '1rem', fontSize: '1rem' }}>{selectedContent.qcm.title}</h5>
                  {selectedContent.qcm.questions?.map((question, qIndex) => (
                    <div key={question.id} style={{ marginBottom: '2rem' }}>
                      <div style={{ 
                        fontWeight: '500', 
                        marginBottom: '1rem',
                        fontSize: '1rem'
                      }}>
                        {qIndex + 1}. {question.question}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {question.options.map((option) => (
                          <label 
                            key={option.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem',
                              backgroundColor: 'white',
                              border: '1px solid #E5E7EB',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <input type="radio" name={`question-${question.id}`} style={{ cursor: 'pointer' }} />
                            <span style={{ fontSize: '0.875rem' }}>{option.text}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* File Download Section */}
              <div style={{ 
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#F3F4F6',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{getContentIcon(selectedContent.content_type)}</span>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{getFileName(selectedContent)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{getFileSize(selectedContent)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {(selectedContent.pdf_content || selectedContent.video_content) && (
                    <>
                      <a
                        href={getPdfUrl(selectedContent) || getVideoUrl(selectedContent) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          color: '#F97316',
                          textDecoration: 'none',
                          fontWeight: '500'
                        }}
                      >
                        Ouvrir dans un nouvel onglet
                      </a>
                      <span style={{ color: '#E5E7EB' }}>•</span>
                      <a
                        href={getPdfUrl(selectedContent) || getVideoUrl(selectedContent) || '#'}
                        download
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          color: '#F97316',
                          textDecoration: 'none',
                          fontWeight: '500'
                        }}
                      >
                        Télécharger
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{ 
              padding: '1.5rem',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: '0.625rem 1.5rem',
                  backgroundColor: '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
              <button
                onClick={handleMarkAsCompleted}
                disabled={selectedContent.min_required_time ? timeSpent < (selectedContent.min_required_time * 60) : false}
                style={{
                  padding: '0.625rem 1.5rem',
                  backgroundColor: (selectedContent.min_required_time && timeSpent < (selectedContent.min_required_time * 60)) ? '#9CA3AF' : '#4338CA',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: (selectedContent.min_required_time && timeSpent < (selectedContent.min_required_time * 60)) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>✓</span>
                Mark as completed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;