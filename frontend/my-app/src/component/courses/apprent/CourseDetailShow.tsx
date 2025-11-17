import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api/api';

// 1️⃣ Add Notification Types and Components at the top
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
  estimated_duration?: number;
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

  // Statistics fields
  apprenants_count?: number;
  avg_progress?: number;
  your_progress?: number;
  estimated_duration_display?: string;
}

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [selectedQCMOptions, setSelectedQCMOptions] = useState<{ [questionId: number]: number[] }>({});
  const [timerInterval, setTimerInterval] = useState<number | null>(null);

useEffect(() => {
  const id = setTimeout(() => {
    console.log("Hello");
  }, 1000);

  setTimerInterval(id);

  return () => {
    if (timerInterval) clearTimeout(timerInterval);
  };
}, []);

  // 2️⃣ Add Notification State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Effect to handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper function to determine if mobile view
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // 3️⃣ Add Notification Functions
  const addNotification = (
    type: NotificationType,
    title: string,
    message: string,
    duration: number = 5000
  ) => {
    const id = Date.now();
    setNotifications((prev) => [
      ...prev,
      { id, type, title, message, duration },
    ]);
  };

  const removeNotification = (id: number) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  // Enhanced duration calculation with proper typing
  const calculateTotalDuration = (courseData: Course | null): number => {
    if (!courseData) return 0;

    // Use backend value if available and valid
    if (courseData.estimated_duration && courseData.estimated_duration > 0) {
      return courseData.estimated_duration;
    }

    // Calculate from modules and contents
    if (courseData.modules) {
      return courseData.modules.reduce((total: number, module: Module) => {
        let moduleDuration = module.estimated_duration || 0;

        // If module duration is 0, calculate from contents
        if (moduleDuration === 0 && module.contents) {
          moduleDuration = module.contents.reduce((contentTotal: number, content: Content) => {
            return contentTotal + (content.estimated_duration || 0);
          }, 0);
        }

        return total + moduleDuration;
      }, 0);
    }

    return 0;
  };

  const formatDurationDisplay = (minutes: number): string => {
    if (!minutes || minutes === 0) return '0min';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`.trim();
    }
    return `${mins}min`;
  };

  const normalizeQCMContent = (content: Content): Content => {
    const normalizedContent = { ...content };

    if (content.content_type_name?.toLowerCase() === 'qcm' && content.qcm) {
      const qcm = content.qcm;

      let questions: QCMQuestion[] = [];
      if (Array.isArray(qcm.questions) && qcm.questions.length > 0) {
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

  // Helper function to check if content is completed
  const isContentCompleted = (content: Content) => {
    return content.is_completed || userProgress.completedContents.includes(content.id);
  };

  // Calculate frontend statistics as fallback
  const calculateFrontendStats = () => {
    if (!course || !course.modules) return null;

    const totalContents = course.modules.reduce((total: number, module: Module) =>
      total + (module.contents?.length || 0), 0
    );

    const completedContents = course.modules.reduce((total: number, module: Module) =>
      total + (module.contents?.filter((content: Content) =>
        content.is_completed || userProgress.completedContents.includes(content.id)
      ).length || 0), 0
    );

    const yourProgress = totalContents > 0 ? Math.round((completedContents / totalContents) * 100) : 0;

    return {
      yourProgress,
      totalContents,
      completedContents
    };
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching course data...');
        const response = await api.get(`courses/${id}/`);
        console.log('✅ Complete Course API Response:', response.data);

        setCourse(response.data);

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
        let userProgressData: any;

        if (savedProgress) {
          userProgressData = JSON.parse(savedProgress);
        } else {
          userProgressData = {
            completedContents: [],
            completedQCMs: [],
            timeSpent: {}
          };
        }

        // Sync with backend completion status
        if (response.data.modules) {
          const backendCompletedContents: number[] = [];

          response.data.modules.forEach((module: Module) => {
            module.contents.forEach((content: Content) => {
              if (content.is_completed && !userProgressData.completedContents.includes(content.id)) {
                backendCompletedContents.push(content.id);
              }
            });
          });

          if (backendCompletedContents.length > 0) {
            userProgressData = {
              ...userProgressData,
              completedContents: [...userProgressData.completedContents, ...backendCompletedContents]
            };
            localStorage.setItem(`course_progress_${id}`, JSON.stringify(userProgressData));
          }
        }

        setUserProgress(userProgressData);

      } catch (error: any) {
        console.error('❌ Error fetching course:', error);
        addNotification(
          "error",
          "Erreur",
          "Impossible de charger les détails du cours. Veuillez réessayer."
        );
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
    const videoFile = content.video_content?.video_file;
    if (videoFile) {
      let url = videoFile;
      url = url.replace('http://backend:8000', BASE_URL);

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

  // Function to reset progress if needed
  const resetProgress = () => {
    localStorage.removeItem(`course_progress_${id}`);
    setUserProgress({
      completedContents: [],
      completedQCMs: [],
      timeSpent: {}
    });
    addNotification(
      "success",
      "Progression réinitialisée",
      "Votre progression a été réinitialisée avec succès."
    );
  };

  const handleMarkAsCompleted = async () => {
    if (selectedContent) {
      const hasMetTimeRequirement = !selectedContent.min_required_time ||
        (userProgress.timeSpent[selectedContent.id] || 0) >= (selectedContent.min_required_time * 60);

      if (!hasMetTimeRequirement) {
        addNotification(
          "warning",
          "Temps requis",
          `Vous devez passer au moins ${selectedContent.min_required_time} minutes sur ce contenu avant de le marquer comme terminé.`
        );
        return;
      }

      try {
        const contentType = selectedContent.content_type_name?.toLowerCase();
        const actualTimeSpent = Math.ceil((userProgress.timeSpent[selectedContent.id] || 0) / 60);

        console.log('Marking as completed with estimated_duration:', actualTimeSpent);

        let apiCall;

        if (contentType === 'qcm') {
          const isQCMCompleted = userProgress.completedQCMs?.includes(selectedContent.id) || selectedContent.is_completed;

          if (!isQCMCompleted) {
            addNotification(
              "warning",
              "QCM requis",
              "Vous devez d'abord compléter et soumettre le QCM avant de marquer ce contenu comme terminé."
            );
            return;
          }

          apiCall = api.patch(`contents/${selectedContent.id}/`, {
            is_completed: true,
            estimated_duration: actualTimeSpent
          });

        } else if (contentType === 'pdf') {
          apiCall = api.post(`courses/${id}/completePdf/`, {
            content_id: selectedContent.id,
            estimated_duration: actualTimeSpent
          });

        } else if (contentType === 'video') {
          apiCall = api.post(`courses/${id}/completeVideo/`, {
            content_id: selectedContent.id,
            estimated_duration: actualTimeSpent
          });

        } else {
          apiCall = api.patch(`contents/${selectedContent.id}/`, {
            is_completed: true,
            estimated_duration: actualTimeSpent
          });
        }

        const response = await apiCall;
        console.log('Backend response:', response.data);

        const newProgress = {
          ...userProgress,
          completedContents: [...userProgress.completedContents, selectedContent.id]
        };

        setUserProgress(newProgress);
        localStorage.setItem(`course_progress_${id}`, JSON.stringify(newProgress));

        setCourse(prev => {
          if (!prev) return prev;

          const updatedModules = prev.modules.map(module => ({
            ...module,
            contents: module.contents.map(content =>
              content.id === selectedContent.id
                ? {
                  ...content,
                  estimated_duration: actualTimeSpent,
                  is_completed: true
                }
                : content
            )
          }));

          return {
            ...prev,
            modules: updatedModules
          };
        });

        addNotification(
          "success",
          "Contenu terminé",
          "Le contenu a été marqué comme terminé et la durée a été mise à jour."
        );

        setShowModal(false);
        setSelectedContent(null);

        setTimeout(async () => {
          try {
            const refreshResponse = await api.get(`courses/${id}/`);
            setCourse(refreshResponse.data);
          } catch (error) {
            console.error('Error refreshing course:', error);
          }
        }, 1000);

      } catch (error: any) {
        console.error('Error marking content as completed:', error);
        addNotification(
          "error",
          "Erreur",
          `Erreur lors de la mise à jour: ${error.response?.data?.message || error.message}`
        );
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
      const questionAnswers: { [questionId: number]: number[] } = {};

      Object.keys(selectedQCMOptions).forEach(questionId => {
        const questionIdNum = parseInt(questionId);
        const selectedOptions = selectedQCMOptions[questionIdNum];
        if (selectedOptions && selectedOptions.length > 0) {
          questionAnswers[questionIdNum] = selectedOptions;
        }
      });

      const actualTimeSpent = Math.ceil(timeSpent / 60);

      console.log('Submitting QCM with data:', {
        content_id: selectedContent.id,
        question_answers: questionAnswers,
        time_taken: timeSpent,
        estimated_duration: actualTimeSpent
      });

      const response = await api.post(`courses/${id}/submit-qcm/`, {
        content_id: selectedContent.id,
        question_answers: questionAnswers,
        time_taken: timeSpent,
        estimated_duration: actualTimeSpent
      });

      if (response.data.is_passed) {
        setUserProgress(prev => {
          const newProgress = {
            ...prev,
            completedQCMs: [...(prev.completedQCMs || []), selectedContent.id],
            completedContents: [...prev.completedContents, selectedContent.id]
          };
          localStorage.setItem(`course_progress_${id}`, JSON.stringify(newProgress));
          return newProgress;
        });

        setCourse(prev => {
          if (!prev) return prev;

          const updatedModules = prev.modules.map(module => ({
            ...module,
            contents: module.contents.map(content =>
              content.id === selectedContent.id
                ? {
                  ...content,
                  estimated_duration: actualTimeSpent,
                  is_completed: true
                }
                : content
            )
          }));

          return {
            ...prev,
            modules: updatedModules
          };
        });

        addNotification(
          "success",
          "QCM réussi!",
          "Le QCM a été réussi et le contenu a été marqué comme terminé."
        );

        setShowModal(false);
        setSelectedContent(null);

        setTimeout(async () => {
          try {
            const courseResponse = await api.get(`courses/${id}/`);
            setCourse(courseResponse.data);
          } catch (error) {
            console.error('Error refreshing course after QCM:', error);
          }
        }, 1000);
      } else {
        addNotification(
          "warning",
          "QCM échoué",
          `Score: ${response.data.percentage}% (Minimum requis: ${response.data.passing_score}%). Veuillez réessayer.`
        );
      }
    } catch (error: any) {
      console.error('Error submitting QCM:', error);
      addNotification(
        "error",
        "Erreur QCM",
        `Erreur lors de la soumission du QCM: ${error.response?.data?.message || error.message}`
      );
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
        <div style={{ color: '#374151', fontSize: isMobile ? '1.25rem' : '1.5rem' }}>⏳ Chargement...</div>
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
        <div style={{ color: '#374151', fontSize: isMobile ? '1.25rem' : '1.5rem' }}>Formation non trouvée</div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(course.status);
  const frontendStats = calculateFrontendStats();
  const totalDuration = calculateTotalDuration(course);
  const displayDuration = course?.estimated_duration_display || formatDurationDisplay(totalDuration);

  return (
    <div style={{ backgroundColor: '#F3F4F6', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#212068',
        color: 'white',
        padding: isMobile ? '1rem 0' : '1.5rem 0'
      }}>
        <div style={{
          maxWidth: '1400px',  // Same as your main content
          margin: '0 auto',     // Center the container
          padding: isMobile ? '0 1rem' : '0 2rem',  // Add padding inside
          display: 'flex',
          gap: '1rem',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center'
        }}>
          <h1 style={{
            fontSize: isMobile ? '1.5rem' : '1.75rem',
            fontWeight: 'bold',
            margin: 0,
            marginBottom: isMobile ? '0.5rem' : '0'
          }}>
            {course.title_of_course}
          </h1>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{
              backgroundColor: statusBadge.color,
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap'
            }}>
              {statusBadge.text}
            </span>
          </div>
        </div>
        <p style={{
          maxWidth: '1400px',      // Same as your main content
          margin: '0 auto',         // Center the container
          padding: isMobile ? '0.5rem 1rem 0' : '0.5rem 2rem 0',  // Add padding inside
          fontSize: isMobile ? '0.8rem' : '0.9rem',
          opacity: 0.9
        }}>
          {course.description}
        </p>
      </div>

      {/* Stats Bar */}
      <div style={{
        backgroundColor: '#212068',
        padding: isMobile ? '1rem' : '0 2rem 2rem 2rem'
      }}>
        <div style={{
          display: 'grid',
          maxWidth: '1400px',
          margin: '0 auto',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
          gap: isMobile ? '1rem' : '2rem',
          padding: isMobile ? '0 1rem' : '0 2rem',
          color: 'white'
        }}>
          <div>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', opacity: 0.8 }}>Contenu total</div>
            <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold' }}>
              {course.modules?.reduce((total: number, module: Module) => total + (module.contents?.length || 0), 0).toString().padStart(2, '0') || '00'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', opacity: 0.8 }}>N° de modules</div>
            <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold' }}>0{course.modules?.length || 0}</div>
          </div>
          <div>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', opacity: 0.8 }}>N° d'apprenants</div>
            <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold' }}>
              {course.apprenants_count || 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', opacity: 0.8 }}>Progrès moyen</div>
            <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold' }}>
              {Math.round(course.avg_progress || 0)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', opacity: 0.8 }}>Votre progrès</div>
            <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold' }}>
              {Math.round(course.your_progress || frontendStats?.yourProgress || 0)}%
            </div>
          </div>
          <div>
            {/* <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', opacity: 0.8 }}>Temps estimé</div>
            <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold' }}>
              {displayDuration}
            </div> */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        padding: isMobile ? '1rem' : '2rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '1rem' : '2rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Left Sidebar */}
        <div style={{
          width: isMobile ? '100%' : '300px',
          flexShrink: 0
        }}>
          <div style={{
            backgroundColor: '#E5E7EB',
            borderRadius: '8px',
            height: isMobile ? '150px' : '200px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {course.image_url ? (
              <img
                src={getimageUrl(course.image_url)}
                alt="Course"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '8px'
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
                <div style={{ fontSize: isMobile ? '2rem' : '3rem' }}>📚</div>
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

          <p style={{
            fontSize: '0.875rem',
            color: '#4B5563',
            lineHeight: '1.6',
            marginBottom: '1rem',
            display: isMobile ? 'none' : 'block'
          }}>
            {course.description}
          </p>

          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'row' : 'column',
            gap: isMobile ? '2rem' : '0',
            justifyContent: isMobile ? 'space-between' : 'flex-start'
          }}>
            <div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span>👤 </span>
                <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Créée par</span>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '1rem' }}>
                {course.creator?.username || course.creator_username || 'Inconnu'}
              </div>
            </div>

            <div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span>📅 </span>
                <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Créée le</span>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                {formatDate(course.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Modules */}
        <div style={{ flex: 1 }}>
          {course.modules && course.modules.length > 0 ? (
            course.modules.map((module: Module) => (
              <div key={module.id} style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: isMobile ? '1rem' : '1rem 1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '0.5rem' : '0'
                  }}>
                    <h3 style={{
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      fontWeight: '600',
                      margin: 0
                    }}>
                      Module {module.order} • {module.title}
                    </h3>
                  </div>

                  {module.contents && module.contents.length > 0 ? (
                    module.contents.map((content: Content) => (
                      <div
                        key={content.id}
                        onClick={() => handleContentClick(content)}
                        style={{
                          display: 'flex',
                          padding: isMobile ? '0.5rem' : '0.75rem',
                          backgroundColor: '#F9FAFB',
                          borderRadius: '6px',
                          marginBottom: '0.5rem',
                          border: '1px solid #E5E7EB',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          flexDirection: isMobile ? 'column' : 'row',
                          gap: isMobile ? '0.5rem' : '0'
                        }}
                        onMouseEnter={(e) => {
                          if (!isMobile) {
                            e.currentTarget.style.backgroundColor = '#EEF2FF';
                            e.currentTarget.style.borderColor = '#2D2B6B';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isMobile) {
                            e.currentTarget.style.backgroundColor = '#F9FAFB';
                            e.currentTarget.style.borderColor = '#E5E7EB';
                          }
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          flex: 1
                        }}>
                          <span>{getContentIcon(content.content_type_name)}</span>
                          <span style={{
                            fontSize: isMobile ? '0.8rem' : '0.875rem',
                            color: '#1F2937'
                          }}>
                            {content.title}
                          </span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          alignSelf: isMobile ? 'flex-end' : 'center'
                        }}>
                          {content.estimated_duration && (
                            <span style={{
                              fontSize: isMobile ? '0.75rem' : '0.875rem',
                              color: '#6B7280'
                            }}>
                              {formatDuration(content.estimated_duration)}
                            </span>
                          )}
                          {isContentCompleted(content) && (
                            <span style={{
                              fontSize: isMobile ? '0.75rem' : '0.875rem',
                              color: '#10B981',
                              fontWeight: '500'
                            }}>
                              ✓ Complété
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      padding: '1rem',
                      textAlign: 'center',
                      color: '#6B7280',
                      fontSize: '0.875rem'
                    }}>
                      Aucun contenu dans ce module
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: isMobile ? '2rem' : '3rem', marginBottom: '1rem' }}>📚</div>
              <div style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                Aucun module trouvé
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                Cette formation ne contient pas encore de modules.
              </div>
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
          padding: isMobile ? '0.5rem' : '2rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: isMobile ? '95vh' : '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: isMobile ? '1rem' : '1.5rem',
              borderBottom: '1px solid #E5E7EB'
            }}>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '0.5rem',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center'
              }}>
                <span style={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
                  {getContentIcon(selectedContent.content_type_name)}
                </span>
                <h3 style={{
                  margin: 0,
                  fontSize: isMobile ? '1rem' : '1.25rem',
                  fontWeight: '600',
                  textAlign: isMobile ? 'center' : 'left'
                }}>
                  {selectedContent.title}
                </h3>
              </div>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: '#6B7280',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                Module {course.modules.find(m => m.contents.some(c => c.id === selectedContent.id))?.order} • {course.modules.find(m => m.contents.some(c => c.id === selectedContent.id))?.title}
              </div>
            </div>

            {/* Time Required Banner */}
            {selectedContent.min_required_time && (
              <div style={{
                backgroundColor: '#FEF3C7',
                padding: isMobile ? '0.75rem' : '1rem 1.5rem',
                borderBottom: '1px solid #E5E7EB'
              }}>
                <p style={{
                  margin: 0,
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: '#92400E'
                }}>
                  <strong>Temps requis :</strong> Vous devez passer {selectedContent.min_required_time} minutes ou plus dans ce cours avant de pouvoir marquer le contenu comme terminé.
                </p>
              </div>
            )}

            {/* Content Description */}
            {selectedContent.caption && (
              <div style={{
                padding: isMobile ? '0.75rem' : '1rem 1.5rem',
                backgroundColor: '#F9FAFB',
                borderBottom: '1px solid #E5E7EB'
              }}>
                <h4 style={{
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  À propos du contenu
                </h4>
                <p style={{
                  margin: 0,
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: '#6B7280',
                  lineHeight: '1.5'
                }}>
                  {selectedContent.caption}
                </p>
              </div>
            )}

            {/* Timer Display */}
            <div style={{
              padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
              backgroundColor: '#EEF2FF',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '0.5rem' : '0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>⏱️</span>
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: '#4338CA',
                  fontWeight: '500'
                }}>
                  Temps estimé de lecture : {selectedContent.estimated_duration || 0}min
                </span>
              </div>
              <div style={{
                fontSize: isMobile ? '0.875rem' : '1rem',
                fontWeight: '600',
                color: '#4338CA'
              }}>
                {formatTime(timeSpent)} / {formatTime((selectedContent.estimated_duration || 0) * 60)}
              </div>
            </div>

            {/* Content Area */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: isMobile ? '1rem' : '1.5rem'
            }}>
              <h4 style={{
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                Contenu à lire
              </h4>

              {/* Video Content */}
              {selectedContent.content_type_name?.toLowerCase() === 'video' && (
                <div>
                  {getVideoUrl(selectedContent) ? (
                    <video
                      controls
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: isMobile ? '300px' : '500px',
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
                      padding: isMobile ? '2rem' : '3rem',
                      textAlign: 'center',
                      color: 'white'
                    }}>
                      <div style={{ fontSize: isMobile ? '2rem' : '3rem', marginBottom: '1rem' }}>🎥</div>
                      <div>Vidéo non disponible</div>
                    </div>
                  )}
                </div>
              )}

              {/* QCM Content */}
              {selectedContent.content_type_name?.toLowerCase() === 'qcm' && selectedContent.qcm && (
                <div style={{
                  padding: isMobile ? '1rem' : '1.5rem',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #E5E7EB',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '0.5rem' : '0'
                  }}>
                    <h5 style={{
                      margin: 0,
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      fontWeight: '600'
                    }}>
                      {selectedContent.qcm.title}
                    </h5>
                    <div style={{
                      display: 'flex',
                      gap: isMobile ? '0.5rem' : '1rem',
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      color: '#6B7280',
                      flexWrap: 'wrap'
                    }}>
                      <span>Score: {selectedContent.qcm.passing_score}%</span>
                      <span>Tentatives: {selectedContent.qcm.max_attempts}</span>
                      {selectedContent.qcm.time_limit && selectedContent.qcm.time_limit > 0 && (
                        <span>Temps: {selectedContent.qcm.time_limit}min</span>
                      )}
                    </div>
                  </div>

                  {selectedContent.qcm.questions?.map((question, qIndex) => (
                    <div key={question.id || qIndex} style={{
                      marginBottom: '2rem',
                      padding: isMobile ? '0.75rem' : '1rem',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <div style={{
                        fontWeight: '500',
                        marginBottom: '1rem',
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? '0.5rem' : '0'
                      }}>
                        <span>{qIndex + 1}. {question.question}</span>
                        <span style={{
                          fontSize: '0.75rem',
                          backgroundColor: '#EEF2FF',
                          color: '#4338CA',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
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
                              padding: isMobile ? '0.5rem' : '0.75rem',
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
                              fontSize: isMobile ? '0.8rem' : '0.875rem',
                              color: selectedQCMOptions[question.id]?.includes(option.id) ? '#4338CA' : '#374151'
                            }}>
                              {option.text}
                            </span>
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
                padding: isMobile ? '0.75rem' : '1rem',
                backgroundColor: '#F3F4F6',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '0.75rem' : '0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
                    {getContentIcon(selectedContent.content_type_name)}
                  </span>
                  <div>
                    <div style={{
                      fontSize: isMobile ? '0.8rem' : '0.875rem',
                      fontWeight: '500'
                    }}>
                      {getFileName(selectedContent)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      {getFileSize(selectedContent)}
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: isMobile ? '0.5rem' : '0.75rem',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'stretch' : 'center'
                }}>
                  {(selectedContent.pdf_content || selectedContent.video_content) && (
                    <>
                      <a
                        href={getPdfUrl(selectedContent) || getVideoUrl(selectedContent) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          color: '#F97316',
                          textDecoration: 'none',
                          fontWeight: '500',
                          textAlign: 'center',
                          border: isMobile ? '1px solid #F97316' : 'none',
                          borderRadius: isMobile ? '4px' : '0'
                        }}
                      >
                        Ouvrir dans un nouvel onglet
                      </a>
                      {!isMobile && <span style={{ color: '#E5E7EB' }}>•</span>}
                      <a
                        href={getPdfUrl(selectedContent) || getVideoUrl(selectedContent) || '#'}
                        download
                        style={{
                          padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          color: '#F97316',
                          textDecoration: 'none',
                          fontWeight: '500',
                          textAlign: 'center',
                          border: isMobile ? '1px solid #F97316' : 'none',
                          borderRadius: isMobile ? '4px' : '0'
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
              padding: isMobile ? '1rem' : '1.5rem',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.5rem',
                  backgroundColor: '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  order: isMobile ? 2 : 1
                }}
              >
                Fermer
              </button>
              {selectedContent.content_type_name?.toLowerCase() !== 'qcm' && (
                <button
                  onClick={handleMarkAsCompleted}
                  disabled={
                    isContentCompleted(selectedContent) ||
                    (!!selectedContent.min_required_time && (userProgress.timeSpent[selectedContent.id] || 0) < (selectedContent.min_required_time * 60))
                  }
                  style={{
                    padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.5rem',
                    backgroundColor: isContentCompleted(selectedContent)
                      ? '#10B981'
                      : (!!selectedContent.min_required_time && (userProgress.timeSpent[selectedContent.id] || 0) < (selectedContent.min_required_time * 60))
                        ? '#9CA3AF'
                        : '#4338CA',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    fontWeight: '500',
                    cursor: isContentCompleted(selectedContent) ||
                      (!!selectedContent.min_required_time && (userProgress.timeSpent[selectedContent.id] || 0) < (selectedContent.min_required_time * 60))
                      ? 'not-allowed'
                      : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    justifyContent: 'center',
                    order: isMobile ? 1 : 2
                  }}
                >
                  <span>✓</span>
                  {isContentCompleted(selectedContent) ? 'Terminé' : 'Marquer comme terminé'}
                </button>
              )}
              {selectedContent.content_type_name?.toLowerCase() === 'qcm' && (
                <button
                  onClick={handleQCMSubmit}
                  disabled={
                    isContentCompleted(selectedContent) ||
                    (!!selectedContent.min_required_time && (userProgress.timeSpent[selectedContent.id] || 0) < (selectedContent.min_required_time * 60))
                  }
                  style={{
                    padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.5rem',
                    backgroundColor: isContentCompleted(selectedContent)
                      ? '#10B981'
                      : (!!selectedContent.min_required_time && (userProgress.timeSpent[selectedContent.id] || 0) < (selectedContent.min_required_time * 60))
                        ? '#9CA3AF'
                        : '#4338CA',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: isMobile ? '0.8rem' : '0.875rem',
                    fontWeight: '500',
                    cursor: isContentCompleted(selectedContent) ||
                      (!!selectedContent.min_required_time && (userProgress.timeSpent[selectedContent.id] || 0) < (selectedContent.min_required_time * 60))
                      ? 'not-allowed'
                      : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    justifyContent: 'center',
                    order: isMobile ? 1 : 2
                  }}
                >
                  <span>✓</span>
                  {isContentCompleted(selectedContent) ? 'Terminé' : 'Marquer comme terminé'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4️⃣ Add Notification Container at the end */}
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />
    </div>
  );
};

export default CourseDetail;