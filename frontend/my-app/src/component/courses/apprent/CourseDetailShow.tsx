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
  question_type: 'single' | 'multiple';
  options: QCMOption[];
  points?: number;
  order?: number;
}

interface QCM {
  id: number;
  title: string;
  questions: QCMQuestion[];
  passing_score?: number;
  max_attempts?: number;
  time_limit?: number;
}

interface Content {
  id: number;
  title: string;
  content_type_name: string;
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
  image_url?: string;
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
  const [selectedQCMOptions, setSelectedQCMOptions] = useState<{[questionId: number]: number[]}>({});

  const normalizeQCMContent = (content: Content): Content => {
    const normalizedContent = { ...content };

    if (content.content_type_name?.toLowerCase() === 'qcm' && content.qcm) {
      const qcm = content.qcm;

      // Normalisation des questions
      let questions: QCMQuestion[] = [];
      console.log('just +++++++++++', qcm);
      if (Array.isArray(qcm.questions) && qcm.questions.length > 0) {
        // Format multi-questions
        questions = qcm.questions.map((q: any, index: number) => ({
          id: q.id || index + 1,
          question: q.question || '',
          question_type: q.question_type || 'single',
          options: (q.options || []).map((opt: any, optIndex: number) => ({
            id: opt.id || optIndex + 1,
            text: opt.text || '',
            is_correct: Boolean(opt.is_correct)
          })),
          points: q.points || 1,
          order: q.order || index + 1
        }));
      } else {
        // Si pas de questions ou format invalide, créer une question par défaut
        questions = [{
          id: 1,
          question: content.title || 'Question',
          question_type: 'single',
          options: [
            { id: 1, text: 'Option 1', is_correct: false },
            { id: 2, text: 'Option 2', is_correct: false }
          ],
          points: 1,
          order: 1
        }];
      }

      normalizedContent.qcm = {
        id: qcm.id,
        title: qcm.title || content.title,
        questions,
        passing_score: qcm.passing_score || 80,
        max_attempts: qcm.max_attempts || 3,
        time_limit: qcm.time_limit || 0
      };
    }

    return normalizedContent;
  };

  const [userProgress, setUserProgress] = useState<{
    completedContents: number[];
    completedQCMs: number[];
    timeSpent: { [contentId: number]: number };
  }>({
    completedContents: [],
    completedQCMs: [],
    timeSpent: {}
  });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await api.get(`courses/${id}/`);
        setCourse(response.data);
        console.log('---------------------i need it', response.data);

        // Normaliser les contenus QCM
        if (response.data.modules) {
          const normalizedModules = response.data.modules.map((module: Module) => ({
            ...module,
            contents: module.contents.map((content: Content) => normalizeQCMContent(content))
          }));
          setCourse(prev => prev ? { ...prev, modules: normalizedModules } : null);
        }

        // Load user progress from localStorage
        const savedProgress = localStorage.getItem(`course_progress_${id}`);
        if (savedProgress) {
          setUserProgress(JSON.parse(savedProgress));
        }
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

  // Update time spent in userProgress when modal closes
  useEffect(() => {
    return () => {
      if (selectedContent && timeSpent > 0) {
        setUserProgress(prev => {
          const newProgress = {
            ...prev,
            timeSpent: {
              ...prev.timeSpent,
              [selectedContent.id]: (prev.timeSpent[selectedContent.id] || 0) + timeSpent
            }
          };
          localStorage.setItem(`course_progress_${id}`, JSON.stringify(newProgress));
          return newProgress;
        });
      }
    };
  }, [selectedContent, timeSpent, id]);

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
        return '🎬';
      case 'pdf':
        return '📄';
      case 'qcm':
        return <img src="/cerveau.png" alt="QCM" width={20} height={20} />;
      default:
        return '📌';
    }
  };

  const BASE_URL = 'http://localhost:8000';

  const getVideoUrl = (content: Content) => {
    console.log(content)
    const videoFile = content.video_content?.video_file;
    if (videoFile) {
      let url = videoFile;

      // Replace backend domain with localhost if necessary
      url = url.replace('http://backend:8000', BASE_URL);
      console.log('url', url);

      if (!url.startsWith('http')) {
        url = `${BASE_URL}${url}`;
      }

      return url;
    }
    return null;
  };

  const getimageUrl = (contentOrPath: Content | string | undefined): string | undefined => {
    if (!contentOrPath) return undefined;

    let imagePath: string | undefined;

    if (typeof contentOrPath === 'string') {
      imagePath = contentOrPath;
    } else {
      imagePath = contentOrPath.video_content?.video_file
        || (contentOrPath as any).video_file
        || contentOrPath.pdf_content?.pdf_file
        || (contentOrPath as any).image_url;
    }

    if (!imagePath) return undefined;

    let url = imagePath.replace('http://backend:8000', BASE_URL);

    if (!url.startsWith('http')) {
      url = `${BASE_URL}${url}`;
    }

    return url;
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
    setSelectedQCMOptions({});
  };

  const handleMarkAsCompleted = async () => {
    if (selectedContent) {
      const hasMetTimeRequirement = !selectedContent.min_required_time ||
        (userProgress.timeSpent[selectedContent.id] || 0) >= (selectedContent.min_required_time * 60);

      if (!hasMetTimeRequirement) {
        alert(`Vous devez passer au moins ${selectedContent.min_required_time} minutes sur ce contenu avant de le marquer comme terminé.`);
        return;
      }

      try {
        const contentType = selectedContent.content_type_name?.toLowerCase();

        if (contentType === 'qcm') {
          // For QCM content, check if it has already been completed
          const isQCMCompleted = userProgress.completedQCMs?.includes(selectedContent.id);
          
          if (!isQCMCompleted) {
            alert('Vous devez d\'abord compléter et soumettre le QCM avant de marquer ce contenu comme terminé.');
            return;
          }

          // If QCM is already completed, mark the content as completed
          await api.patch(`contents/${selectedContent.id}/complete/`);

        } else if (contentType === 'pdf') {
          // For PDF content
          await api.post(`courses/${id}/completePdf/`, {
            content_id: selectedContent.id,
          });

        } else if (contentType === 'video') {
          // For Video content
          await api.post(`courses/${id}/completeVideo/`, {
            content_id: selectedContent.id,
          });

        }

        // Update local state
        setUserProgress(prev => {
          const newProgress = {
            ...prev,
            completedContents: [...prev.completedContents, selectedContent.id]
          };
          localStorage.setItem(`course_progress_${id}`, JSON.stringify(newProgress));
          return newProgress;
        });

        alert('Contenu marqué comme terminé');
        setShowModal(false);
        setSelectedContent(null);

        // Refresh course data
        const response = await api.get(`courses/${id}/`);
        setCourse(response.data);
        
      } catch (error) {
        console.error('Error marking content as completed:', error);
        alert('Erreur lors de la mise à jour');
      }
    }
  };

  const handleQCMOptionChange = (questionId: number, optionId: number, isMultiple: boolean) => {
    setSelectedQCMOptions(prev => {
      if (isMultiple) {
        const currentOptions = prev[questionId] || [];
        const newOptions = currentOptions.includes(optionId)
          ? currentOptions.filter(id => id !== optionId)
          : [...currentOptions, optionId];
        return {
          ...prev,
          [questionId]: newOptions
        };
      } else {
        return {
          ...prev,
          [questionId]: [optionId]
        };
      }
    });
  };

  const handleQCMSubmit = async () => {
  if (!selectedContent) return;

  try {
    // Create the correct structure for question_answers
    const questionAnswers: { [questionId: number]: number[] } = {};
    
    // Populate the question_answers object
    Object.keys(selectedQCMOptions).forEach(questionId => {
      const questionIdNum = parseInt(questionId);
      const selectedOptions = selectedQCMOptions[questionIdNum];
      if (selectedOptions && selectedOptions.length > 0) {
        questionAnswers[questionIdNum] = selectedOptions;
      }
    });

    console.log('Submitting QCM with data:', {
      content_id: selectedContent.id,
      question_answers: questionAnswers,
      time_taken: timeSpent
    });

    const response = await api.post(`courses/${id}/submit-qcm/`, {
      content_id: selectedContent.id,
      question_answers: questionAnswers, // Send as structured object
      time_taken: timeSpent,
    });

    // Check if user passed the QCM
    if (response.data.is_passed) {
      // Update local state to mark QCM as completed
      setUserProgress(prev => {
        const newProgress = {
          ...prev,
          completedQCMs: [...(prev.completedQCMs || []), selectedContent.id],
          completedContents: [...prev.completedContents, selectedContent.id]
        };
        localStorage.setItem(`course_progress_${id}`, JSON.stringify(newProgress));
        return newProgress;
      });

      // Mark content as completed on backend
      // await api.patch(`contents/${selectedContent.id}/complete/`);

      // alert('QCM réussi! Contenu marqué comme terminé.');
      // setShowModal(false);
      // setSelectedContent(null);

      // Refresh course data
      const courseResponse = await api.get(`courses/${id}/`);
      setCourse(courseResponse.data);
    } else {
      alert(`QCM échoué. Score: ${response.data.percentage}% (Minimum requis: ${response.data.passing_score}%). Veuillez réessayer.`);
    }
  } catch (error) {
    console.error('Error submitting QCM:', error);
    alert('Erreur lors de la soumission du QCM');
  }
};

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedContent(null);
    setSelectedQCMOptions({});
  };

  const getPdfUrl = (content: Content) => {
    if (content.pdf_content?.pdf_file) {
      let pdfPath = content.pdf_content.pdf_file;

      // Replace backend domain with localhost if necessary
      pdfPath = pdfPath.replace('http://backend:8000', BASE_URL);

      if (!pdfPath.startsWith('http')) {
        pdfPath = `${BASE_URL}${pdfPath}`;
      }

      return pdfPath;
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
    if (content.content_type_name?.toLowerCase() === 'pdf') {
      return '15MB';
    } else if (content.content_type_name?.toLowerCase() === 'video') {
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
            {course.image_url ? (
              <img src={getimageUrl(course.image_url)} alt="Course" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
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
          {course.modules && course.modules.length > 0 ? (
            course.modules.map((module) => (
              <div key={module.id} style={{ marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      Module {module.order} • {module.title}
                    </h3>
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
                          <span>{getContentIcon(content.content_type_name)}</span>
                          <span style={{ fontSize: '0.875rem', color: '#1F2937' }}>{content.title}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          {/* {content.estimated_duration && (
                            <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                              {formatDuration(content.estimated_duration)}
                            </span>
                          )} */}
                          {userProgress.completedContents.includes(content.id) && (
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
                <span style={{ fontSize: '1.5rem' }}>{getContentIcon(selectedContent.content_type_name)}</span>
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
                  Temps estimé de lecture : {selectedContent.estimated_duration || 0}min
                </span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#4338CA' }}>
                {formatTime(timeSpent)} / {formatTime((selectedContent.estimated_duration || 0) * 60)}
              </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem' }}>Contenu à lire</h4>

              {/* Video Content */}
              {selectedContent.content_type_name?.toLowerCase() === 'video' && (
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
              {selectedContent.content_type_name?.toLowerCase() === 'qcm' && selectedContent.qcm && (
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #E5E7EB'
                  }}>
                    <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                      {selectedContent.qcm.title}
                    </h5>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6B7280' }}>
                      <span>Score de passage: {selectedContent.qcm.passing_score}%</span>
                      <span>Tentatives: {selectedContent.qcm.max_attempts}</span>
                      {selectedContent.qcm.time_limit && selectedContent.qcm.time_limit > 0 && (
                        <span>Temps: {selectedContent.qcm.time_limit}min</span>
                      )}
                    </div>
                  </div>

                  {selectedContent.qcm.questions?.map((question, qIndex) => (
                    <div key={question.id || qIndex} style={{
                      marginBottom: '2rem',
                      padding: '1rem',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <div style={{
                        fontWeight: '500',
                        marginBottom: '1rem',
                        fontSize: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <span>{qIndex + 1}. {question.question}</span>
                        <span style={{
                          fontSize: '0.75rem',
                          backgroundColor: '#EEF2FF',
                          color: '#4338CA',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontWeight: '500'
                        }}>
                          {question.question_type === 'single' ? 'Choix unique' : 'Choix multiple'}
                          {question.points && ` • ${question.points} pt${question.points > 1 ? 's' : ''}`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {question.options.map((option, oIndex) => (
                          <label
                            key={option.id || oIndex}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              backgroundColor: selectedQCMOptions[question.id]?.includes(option.id) ? '#EEF2FF' : 'white',
                              border: `1px solid ${selectedQCMOptions[question.id]?.includes(option.id) ? '#4338CA' : '#E5E7EB'}`
                            }}
                          >
                            <input
                              type={question.question_type === 'single' ? 'radio' : 'checkbox'}
                              name={`question-${question.id || qIndex}`}
                              checked={selectedQCMOptions[question.id]?.includes(option.id) || false}
                              onChange={() => handleQCMOptionChange(question.id, option.id, question.question_type === 'multiple')}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{
                              fontSize: '0.875rem',
                              color: selectedQCMOptions[question.id]?.includes(option.id) ? '#4338CA' : '#374151'
                            }}>
                              {option.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* QCM Submit Button */}
                  {/* <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button
                      onClick={handleQCMSubmit}
                      style={{
                        padding: '0.75rem 2rem',
                        backgroundColor: '#4338CA',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Soumettre le QCM
                    </button>
                  </div> */}
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
                  <span style={{ fontSize: '1.5rem' }}>{getContentIcon(selectedContent.content_type_name)}</span>
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
              {selectedContent.content_type_name?.toLowerCase() !== 'qcm' && (
                <button
                  onClick={handleMarkAsCompleted}
                  disabled={
                    userProgress.completedContents.includes(selectedContent.id) ||
                    (!!selectedContent.min_required_time && (userProgress.timeSpent[selectedContent.id] || 0) < (selectedContent.min_required_time * 60))
                  }
                  style={{
                    padding: '0.625rem 1.5rem',
                    backgroundColor: userProgress.completedContents.includes(selectedContent.id)
                      ? '#10B981'
                      : (!!selectedContent.min_required_time && (userProgress.timeSpent[selectedContent.id] || 0) < (selectedContent.min_required_time * 60))
                        ? '#9CA3AF'
                        : '#4338CA',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: userProgress.completedContents.includes(selectedContent.id) ||
                      (!!selectedContent.min_required_time && (userProgress.timeSpent[selectedContent.id] || 0) < (selectedContent.min_required_time * 60))
                      ? 'not-allowed'
                      : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>✓</span>
                  {userProgress.completedContents.includes(selectedContent.id) ? 'Terminé' : 'Marquer comme terminé'}
                </button>
              )}
              {selectedContent.content_type_name?.toLowerCase() === 'qcm' && (
                <button
                  onClick={handleQCMSubmit}
                  disabled={
                    userProgress.completedContents.includes(selectedContent.id) ||
                    (!!selectedContent.min_required_time && (userProgress.timeSpent[selectedContent.id] || 0) < (selectedContent.min_required_time * 60))
                  }
                  style={{
                    padding: '0.625rem 1.5rem',
                    backgroundColor: userProgress.completedContents.includes(selectedContent.id)
                      ? '#10B981'
                      : (!!selectedContent.min_required_time && (userProgress.timeSpent[selectedContent.id] || 0) < (selectedContent.min_required_time * 60))
                        ? '#9CA3AF'
                        : '#4338CA',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: userProgress.completedContents.includes(selectedContent.id) ||
                      (!!selectedContent.min_required_time && (userProgress.timeSpent[selectedContent.id] || 0) < (selectedContent.min_required_time * 60))
                      ? 'not-allowed'
                      : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>✓</span>
                  {userProgress.completedContents.includes(selectedContent.id) ? 'Terminé' : 'Marquer comme terminé'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;