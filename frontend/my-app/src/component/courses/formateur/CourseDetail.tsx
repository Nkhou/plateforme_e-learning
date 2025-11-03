import React, { useState, useEffect, useRef } from 'react';
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
  video_file?: string;
  is_completed?: boolean;
  progress?: number;
}

interface Module {
  id: number;
  title: string;
  description?: string;
  order: number;
  status: number;
  estimated_duration?: number;
  min_required_time?: number;
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
  subscribers_count?: number;
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
  const [showNewModuleModal, setShowNewModuleModal] = useState(false);
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);
  const [showNewContentModal, setShowNewContentModal] = useState(false);
  const [showEditContentModal, setShowEditContentModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
  const [showContentMenu, setShowContentMenu] = useState<number | null>(null);


  // Enhanced form states with QCM support
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    estimated_duration: undefined as number | undefined,
    min_required_time: undefined as number | undefined
  });

  const [contentForm, setContentForm] = useState({
    title: '',
    caption: '',
    file: null as File | null,
    questions: [{
      question: '',
      question_type: 'single' as 'single' | 'multiple',
      options: [
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]
    }],
    points: 1,
    passing_score: 80,
    max_attempts: 3,
    time_limit: 0,
    estimated_duration: undefined as number | undefined,
    min_required_time: undefined as number | undefined
  });

  // Time tracking state
  const [timeTracking, setTimeTracking] = useState<{
    isTracking: boolean;
    startTime: Date | null;
    currentContent: number | null;
  }>({
    isTracking: false,
    startTime: null,
    currentContent: null
  });
  // Add module status change handler
  const handleChangeModuleStatus = async (module: Module, newStatus: number) => {
    if (!id) return;

    try {
      await api.patch(`courses/${id}/modules/${module.id}/`, {
        status: newStatus
      });

      const response = await api.get(`courses/${id}/`);
      setCourse(response.data);

      alert('Statut du module mis à jour avec succès!');
    } catch (error) {
      console.error('Failed to update module status:', error);
      alert('Échec de mise à jour du statut du module.');
    }
  };
  // User progress state
  const [userProgress, setUserProgress] = useState<{
    completedContents: number[];
    timeSpent: { [contentId: number]: number };
  }>({
    completedContents: [],
    timeSpent: {}
  });

  // Références pour détecter les clics extérieurs
  const contentMenuRef = useRef<HTMLDivElement>(null);
  const newModuleModalRef = useRef<HTMLDivElement>(null);
  const editModuleModalRef = useRef<HTMLDivElement>(null);
  const newContentModalRef = useRef<HTMLDivElement>(null);
  const editContentModalRef = useRef<HTMLDivElement>(null);
  const contentViewerModalRef = useRef<HTMLDivElement>(null);

  // Fonction de normalisation améliorée pour QCM
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

  // Enhanced click outside handler
  // Enhanced click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentMenuRef.current && !contentMenuRef.current.contains(event.target as Node)) {
        setShowContentMenu(null);
        setSelectedContent(null);
      }

      // Close all status dropdowns
      const statusDropdowns = document.querySelectorAll('[id^="course-status-dropdown"], [id^="module-status-dropdown-"]');
      statusDropdowns.forEach(dropdown => {
        if (dropdown instanceof HTMLElement && !dropdown.contains(event.target as Node)) {
          dropdown.style.display = 'none';
        }
      });

      const modals = [
        { show: showNewModuleModal, ref: newModuleModalRef, reset: () => { setShowNewModuleModal(false); setModuleForm({ title: '', description: '', estimated_duration: undefined, min_required_time: undefined }); } },
        { show: showEditModuleModal, ref: editModuleModalRef, reset: () => { setShowEditModuleModal(false); setEditingModule(null); setModuleForm({ title: '', description: '', estimated_duration: undefined, min_required_time: undefined }); } },
        { show: showNewContentModal, ref: newContentModalRef, reset: () => { setShowNewContentModal(false); setSelectedContentType(null); setSelectedModule(null); resetContentForm(); } },
        { show: showEditContentModal, ref: editContentModalRef, reset: () => { setShowEditContentModal(false); setEditingContent(null); resetContentForm(); } },
        { show: showModal, ref: contentViewerModalRef, reset: () => { setShowModal(false); setSelectedContent(null); } }
      ];

      modals.forEach(({ show, ref, reset }) => {
        if (show && ref.current && !ref.current.contains(event.target as Node)) {
          reset();
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNewModuleModal, showEditModuleModal, showNewContentModal, showEditContentModal, showModal]);
  // Reset content form helper
  const resetContentForm = () => {
    setContentForm({
      title: '',
      caption: '',
      file: null,
      questions: [{
        question: '',
        question_type: 'single',
        options: [
          { text: '', is_correct: false },
          { text: '', is_correct: false }
        ]
      }],
      points: 1,
      passing_score: 80,
      max_attempts: 3,
      time_limit: 0,
      estimated_duration: undefined,
      min_required_time: undefined
    });
  };

  // Enhanced course fetching with progress
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

  // Enhanced time tracking with auto-save
  useEffect(() => {
    if (showModal && selectedContent) {
      // Start time tracking
      setTimeTracking({
        isTracking: true,
        startTime: new Date(),
        currentContent: selectedContent.id
      });

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

      // Save time spent when modal closes
      if (timeTracking.isTracking && timeTracking.startTime && timeTracking.currentContent) {
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - timeTracking.startTime.getTime()) / 1000);

        setUserProgress(prev => {
          const newProgress = {
            ...prev,
            timeSpent: {
              ...prev.timeSpent,
              [timeTracking.currentContent!]: (prev.timeSpent[timeTracking.currentContent!] || 0) + duration
            }
          };

          // Save to localStorage
          localStorage.setItem(`course_progress_${id}`, JSON.stringify(newProgress));
          return newProgress;
        });

        setTimeTracking({
          isTracking: false,
          startTime: null,
          currentContent: null
        });
      }

      setTimeSpent(0);
    }
  }, [showModal, selectedContent]);

  // Utility functions
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

  const getContentTypeDisplay = (contentType: string | undefined) => {
    if (!contentType) return 'Contenu';

    switch (contentType.toLowerCase()) {
      case 'video':
        return 'Vidéo';
      case 'pdf':
        return 'Document PDF';
      case 'qcm':
        return 'Quiz QCM';
      default:
        return contentType;
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return { text: 'Brouillon', color: '#F59E0B' };
      case 1:
        return { text: 'Actif', color: '#10B981' };
      case 2:
        return { text: 'Archivé', color: '#6B7280' };
      default:
        return { text: 'Inconnu', color: '#6B7280' };
    }
  };

  // Enhanced content click handler with time tracking
  const handleContentClick = (content: Content) => {
    const normalizedContent = normalizeQCMContent(content);
    setSelectedContent(normalizedContent);
    setShowModal(true);
    setTimeSpent(userProgress.timeSpent[content.id] || 0);
  };

  // Enhanced mark as completed with time validation
  const handleMarkAsCompleted = async () => {
    if (selectedContent) {
      const hasMetTimeRequirement = !selectedContent.min_required_time ||
        (userProgress.timeSpent[selectedContent.id] || 0) >= (selectedContent.min_required_time * 60);

      if (!hasMetTimeRequirement) {
        alert(`Vous devez passer au moins ${selectedContent.min_required_time} minutes sur ce contenu avant de le marquer comme terminé.`);
        return;
      }

      try {
        await api.patch(`contents/${selectedContent.id}/complete/`);

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

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedContent(null);
  };

  // Enhanced module creation with time tracking
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !moduleForm.title.trim()) {
      alert('Veuillez entrer un titre pour le module');
      return;
    }

    try {
      await api.post(`courses/${id}/modules/`, {
        title: moduleForm.title,
        description: moduleForm.description,
        order: (course?.modules.length || 0) + 1,
        status: 1,
        estimated_duration: moduleForm.estimated_duration,
        min_required_time: moduleForm.min_required_time
      });

      const response = await api.get(`courses/${id}/`);
      setCourse(response.data);

      setShowNewModuleModal(false);
      setModuleForm({ title: '', description: '', estimated_duration: undefined, min_required_time: undefined });
      alert('Module créé avec succès!');
    } catch (error: any) {
      console.error('Failed to create module:', error);
      alert(`Échec de création du module: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleForm({
      title: module.title,
      description: module.description || '',
      estimated_duration: module.estimated_duration,
      min_required_time: module.min_required_time
    });
    setShowEditModuleModal(true);
  };

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !editingModule || !moduleForm.title.trim()) {
      alert('Veuillez entrer un titre pour le module');
      return;
    }

    try {
      await api.put(`courses/${id}/modules/${editingModule.id}/`, {
        title: moduleForm.title,
        description: moduleForm.description,
        estimated_duration: moduleForm.estimated_duration,
        min_required_time: moduleForm.min_required_time
      });

      const response = await api.get(`courses/${id}/`);
      setCourse(response.data);

      setShowEditModuleModal(false);
      setEditingModule(null);
      setModuleForm({ title: '', description: '', estimated_duration: undefined, min_required_time: undefined });
      alert('Module mis à jour avec succès!');
    } catch (error: any) {
      console.error('Failed to update module:', error);
      alert(`Échec de mise à jour: ${error.response?.data?.message || error.message}`);
    }
  };

  // Enhanced content editing with QCM support - CORRECTED VERSION
  const handleEditContent = (content: Content) => {
    console.log('=== EDITING CONTENT ===');
    console.log('Raw content:', content);

    const normalizedContent = normalizeQCMContent(content);
    console.log('Normalized content:', normalizedContent);

    setEditingContent(normalizedContent);

    const contentType = normalizedContent.content_type_name?.toLowerCase();
    console.log('Content Type:', contentType);

    if (contentType === 'qcm' && normalizedContent.qcm) {
      const qcm = normalizedContent.qcm;
      console.log('QCM Data:', qcm);
      console.log('QCM Questions:', qcm.questions);

      // Ensure questions array exists and has valid data
      const questions = qcm.questions && qcm.questions.length > 0
        ? qcm.questions.map(question => ({
          question: question.question || '',
          question_type: question.question_type || 'single',
          options: question.options && question.options.length > 0
            ? question.options.map(option => ({
              text: option.text || '',
              is_correct: Boolean(option.is_correct)
            }))
            : [
              { text: '', is_correct: false },
              { text: '', is_correct: false }
            ]
        }))
        : [{
          question: '',
          question_type: 'single' as 'single' | 'multiple',
          options: [
            { text: '', is_correct: false },
            { text: '', is_correct: false }
          ]
        }];

      console.log('Mapped Questions:', questions);

      // Préparer le formulaire QCM avec toutes les données
      const formData = {
        title: normalizedContent.title,
        caption: normalizedContent.caption || '',
        file: null,
        questions: questions,
        points: qcm.questions && qcm.questions[0]?.points ? qcm.questions[0].points : 1,
        passing_score: qcm.passing_score || 80,
        max_attempts: qcm.max_attempts || 3,
        time_limit: qcm.time_limit || 0,
        estimated_duration: normalizedContent.estimated_duration,
        min_required_time: normalizedContent.min_required_time
      };

      console.log('Setting Content Form:', formData);
      setContentForm(formData);
    } else {
      // Pour PDF et vidéo
      setContentForm({
        title: normalizedContent.title,
        caption: normalizedContent.caption || '',
        file: null,
        questions: [{
          question: '',
          question_type: 'single',
          options: [
            { text: '', is_correct: false },
            { text: '', is_correct: false }
          ]
        }],
        points: 1,
        passing_score: 80,
        max_attempts: 3,
        time_limit: 0,
        estimated_duration: normalizedContent.estimated_duration,
        min_required_time: normalizedContent.min_required_time
      });
    }

    setSelectedContentType(contentType || null);
    setShowEditContentModal(true);
    setShowContentMenu(null);
  };

  const handleUpdateContent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !editingContent || !contentForm.title.trim()) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      const contentType = editingContent.content_type_name?.toLowerCase();
      let endpoint = '';
      let requestData: any;

      if (contentType === 'pdf') {
        endpoint = `courses/${id}/contents/pdf/${editingContent.id}/`;
        const formData = new FormData();
        formData.append('title', contentForm.title);
        formData.append('caption', contentForm.caption || '');
        if (contentForm.estimated_duration) formData.append('estimated_duration', contentForm.estimated_duration.toString());
        if (contentForm.min_required_time) formData.append('min_required_time', contentForm.min_required_time.toString());

        if (contentForm.file) {
          formData.append('pdf_file', contentForm.file);
        }

        requestData = formData;
      } else if (contentType === 'video') {
        endpoint = `courses/${id}/contents/video/${editingContent.id}/`;
        const formData = new FormData();
        formData.append('title', contentForm.title);
        formData.append('caption', contentForm.caption || '');
        if (contentForm.estimated_duration) formData.append('estimated_duration', contentForm.estimated_duration.toString());
        if (contentForm.min_required_time) formData.append('min_required_time', contentForm.min_required_time.toString());

        if (contentForm.file) {
          formData.append('video_file', contentForm.file);
        }

        requestData = formData;
      } else if (contentType === 'qcm') {
        endpoint = `courses/${id}/contents/qcm/${editingContent.id}/`;

        // Format des données QCM amélioré
        requestData = {
          title: contentForm.title,
          caption: contentForm.caption || '',
          questions: contentForm.questions.map((question, index) => ({
            question: question.question,
            question_type: question.question_type,
            options: question.options.map(option => ({
              text: option.text,
              is_correct: option.is_correct
            })),
            points: contentForm.points,
            order: index + 1
          })),
          passing_score: contentForm.passing_score,
          max_attempts: contentForm.max_attempts,
          time_limit: contentForm.time_limit,
          estimated_duration: contentForm.estimated_duration,
          min_required_time: contentForm.min_required_time
        };
      }

      if (!endpoint) {
        alert(`Type de contenu non supporté: ${contentType}`);
        return;
      }

      await api.put(endpoint, requestData, {
        headers: contentType === 'qcm' ? { 'Content-Type': 'application/json' } : { 'Content-Type': 'multipart/form-data' }
      });

      const response = await api.get(`courses/${id}/`);
      setCourse(response.data);

      setShowEditContentModal(false);
      setEditingContent(null);
      resetContentForm();
      alert('Contenu mis à jour avec succès!');
    } catch (error: any) {
      console.error('Failed to update content:', error);
      alert(`Échec de mise à jour du contenu: ${error.response?.data?.message || error.message}`);
    }
  };

  // Enhanced content creation with QCM support
  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !selectedModule || !selectedContentType || !contentForm.title.trim()) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      let endpoint = '';
      let requestData: any;

      if (selectedContentType === 'pdf') {
        if (!contentForm.file) {
          alert('Veuillez sélectionner un fichier PDF');
          return;
        }
        endpoint = `courses/${id}/modules/${selectedModule}/contents/pdf/`;
        const formData = new FormData();
        formData.append('title', contentForm.title);
        formData.append('caption', contentForm.caption || '');
        formData.append('order', '1');
        formData.append('status', '1');
        formData.append('pdf_file', contentForm.file);
        if (contentForm.estimated_duration) formData.append('estimated_duration', contentForm.estimated_duration.toString());
        if (contentForm.min_required_time) formData.append('min_required_time', contentForm.min_required_time.toString());
        requestData = formData;
      } else if (selectedContentType === 'video') {
        if (!contentForm.file) {
          alert('Veuillez sélectionner un fichier vidéo');
          return;
        }
        endpoint = `courses/${id}/modules/${selectedModule}/contents/video/`;
        const formData = new FormData();
        formData.append('title', contentForm.title);
        formData.append('caption', contentForm.caption || '');
        formData.append('order', '1');
        formData.append('status', '1');
        formData.append('video_file', contentForm.file);
        if (contentForm.estimated_duration) formData.append('estimated_duration', contentForm.estimated_duration.toString());
        if (contentForm.min_required_time) formData.append('min_required_time', contentForm.min_required_time.toString());
        requestData = formData;
      } else if (selectedContentType === 'qcm') {
        endpoint = `courses/${id}/modules/${selectedModule}/contents/qcm/`;
        requestData = {
          title: contentForm.title,
          caption: contentForm.caption || '',
          order: 1,
          status: 1,
          questions: contentForm.questions.map((question, index) => ({
            question: question.question,
            question_type: question.question_type,
            options: question.options.map(option => ({
              text: option.text,
              is_correct: option.is_correct
            })),
            points: contentForm.points,
            order: index + 1
          })),
          passing_score: contentForm.passing_score,
          max_attempts: contentForm.max_attempts,
          time_limit: contentForm.time_limit,
          estimated_duration: contentForm.estimated_duration,
          min_required_time: contentForm.min_required_time
        };
      }

      await api.post(endpoint, requestData, {
        headers: selectedContentType === 'qcm' ? { 'Content-Type': 'application/json' } : { 'Content-Type': 'multipart/form-data' }
      });

      const response = await api.get(`courses/${id}/`);
      setCourse(response.data);

      setShowNewContentModal(false);
      setSelectedContentType(null);
      setSelectedModule(null);
      resetContentForm();
      alert('Contenu créé avec succès!');
    } catch (error: any) {
      console.error('Failed to create content:', error);
      alert(`Échec de création du contenu: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setContentForm(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  // Enhanced QCM form handlers
  const addQuestion = () => {
    setContentForm(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: '',
          question_type: 'single',
          options: [
            { text: '', is_correct: false },
            { text: '', is_correct: false }
          ]
        }
      ]
    }));
  };

  const removeQuestion = (questionIndex: number) => {
    setContentForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== questionIndex)
    }));
  };

  const addOption = (questionIndex: number) => {
    setContentForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, idx) =>
        idx === questionIndex
          ? { ...q, options: [...q.options, { text: '', is_correct: false }] }
          : q
      )
    }));
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setContentForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, idx) =>
        idx === questionIndex
          ? { ...q, options: q.options.filter((_, oIdx) => oIdx !== optionIndex) }
          : q
      )
    }));
  };

  const handleQuestionChange = (questionIndex: number, field: string, value: any) => {
    setContentForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, idx) =>
        idx === questionIndex ? { ...q, [field]: value } : q
      )
    }));
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, field: string, value: any) => {
    setContentForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, idx) =>
        idx === questionIndex
          ? {
            ...q,
            options: q.options.map((opt, oIdx) =>
              oIdx === optionIndex
                ? field === 'is_correct'
                  ? { ...opt, is_correct: value }
                  : { ...opt, [field]: value }
                : field === 'is_correct' && value && q.question_type === 'single'
                  ? { ...opt, is_correct: false } // Désélectionner les autres pour single choice
                  : opt
            )
          }
          : q
      )
    }));
  };

  const handleChangeContentStatus = async (content: Content, newStatus: number) => {
    if (!id) return;

    try {
      await api.patch(`courses/${id}/contents/${content.id}/update-status/`, {
        status: newStatus
      });

      const response = await api.get(`courses/${id}/`);
      setCourse(response.data);

      setShowContentMenu(null);
      alert('Statut mis à jour avec succès!');
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Échec de mise à jour du statut.');
    }
  };

  // Enhanced URL getters
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
    // Accept either a Content object or a direct string path (e.g. course.image_url)
    if (!contentOrPath) return undefined;

    let imagePath: string | undefined;

    if (typeof contentOrPath === 'string') {
      imagePath = contentOrPath;
    } else {
      // Try common fields that might contain an image/video path on a Content object
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
      return parts[parts.length - 1] || 'document.pdf';
    } else if (content.video_content?.video_file) {
      const parts = content.video_content.video_file.split('/');
      return parts[parts.length - 1] || 'video.mp4';
    }
    return 'fichier';
  };

  const getFileSize = (content: Content): string => {
    // This would typically come from your API
    if (content.content_type_name?.toLowerCase() === 'pdf') {
      return '~2MB';
    } else if (content.content_type_name?.toLowerCase() === 'video') {
      return '~50MB';
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

  // Calculate progress statistics
  const totalContents = course?.modules?.reduce((total, module) => total + (module.contents?.length || 0), 0) || 0;
  const completedContents = userProgress.completedContents.length;
  const progressPercentage = totalContents > 0 ? Math.round((completedContents / totalContents) * 100) : 0;
  const totalTimeSpent = Object.values(userProgress.timeSpent).reduce((total, time) => total + time, 0);

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

      {/* Enhanced Stats Bar */}
      <div style={{ backgroundColor: '#2D2B6B', padding: '0 2rem 2rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '2rem', color: 'white' }}>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Contenu total</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {totalContents.toString().padStart(2, '0')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>N° de modules</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>0{course.modules?.length || 0}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>N° d'apprenants</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{course.subscribers_count || 0}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Progrès moyen</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>0%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Votre progrès</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{progressPercentage}%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Temps passé</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{formatTime(totalTimeSpent)}</div>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setShowNewModuleModal(true)}
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
          </div>

          {course.modules && course.modules.length > 0 ? (
            course.modules.map((module) => (
              <div key={module.id} style={{ marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '200', margin: 0 }}>
                        Module {module.order} • {module.title}
                      </h3>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <span
                          style={{
                            backgroundColor: getStatusBadge(module.status).color,
                            color: 'white',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '8px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Toggle module status dropdown
                            const current = document.getElementById(`module-status-dropdown-${module.id}`);
                            if (current) {
                              current.style.display = current.style.display === 'block' ? 'none' : 'block';
                            }
                          }}
                        >
                          {getStatusBadge(module.status).text}
                          <span style={{ fontSize: '0.5rem' }}>▼</span>
                        </span>

                        {/* Module Status Dropdown */}
                        <div
                          id={`module-status-dropdown-${module.id}`}
                          style={{
                            display: 'none',
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            backgroundColor: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '6px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            minWidth: '140px',
                            zIndex: 20,
                            marginTop: '0.25rem'
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChangeModuleStatus(module, 0);
                              document.getElementById(`module-status-dropdown-${module.id}`)!.style.display = 'none';
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#F59E0B',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              borderRadius: '4px 4px 0 0'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF3C7'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            📝 Brouillon
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChangeModuleStatus(module, 1);
                              document.getElementById(`module-status-dropdown-${module.id}`)!.style.display = 'none';
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#10B981',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1FAE5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            ✓ Actif
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChangeModuleStatus(module, 2);
                              document.getElementById(`module-status-dropdown-${module.id}`)!.style.display = 'none';
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#6B7280',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              borderRadius: '0 0 4px 4px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            📦 Archivé
                          </button>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handleEditModule(module)}
                        style={{
                          color: '#F97316',
                          cursor: 'pointer',
                          background: 'none',
                          border: 'none',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          padding: 0
                        }}
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => {
                          setSelectedModule(module.id);
                          setShowNewContentModal(true);
                        }}
                        style={{ color: '#2D2B6B', cursor: 'pointer', background: 'none', border: 'none', fontSize: '0.875rem', fontWeight: '500', padding: 0 }}
                      >
                        + nouveau contenu
                      </button>
                    </div>
                  </div>

                  {module.contents && module.contents.length > 0 ? (
                    module.contents.map((content) => {
                      const isCompleted = userProgress.completedContents.includes(content.id);
                      const contentTimeSpent = userProgress.timeSpent[content.id] || 0;
                      const hasMetTimeRequirement = !content.min_required_time || contentTimeSpent >= (content.min_required_time * 60);

                      return (
                        <div
                          key={content.id}
                          onClick={() => handleContentClick(content)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem',
                            backgroundColor: isCompleted ? '#F0F9FF' : '#F9FAFB',
                            borderRadius: '6px',
                            marginBottom: '0.5rem',
                            border: `1px solid ${isCompleted ? '#0EA5E9' : '#E5E7EB'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = isCompleted ? '#E0F2FE' : '#EEF2FF';
                            e.currentTarget.style.borderColor = '#2D2B6B';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = isCompleted ? '#F0F9FF' : '#F9FAFB';
                            e.currentTarget.style.borderColor = isCompleted ? '#0EA5E9' : '#E5E7EB';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                            <span style={{ fontSize: '1.2rem' }}>{getContentIcon(content.content_type_name || '')}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {content.title}
                                {isCompleted && (
                                  <span style={{ color: '#10B981', fontSize: '0.75rem' }}>✓</span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#9CA3AF', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <span>{getContentTypeDisplay(content.content_type_name)}</span>
                                {content.estimated_duration && (
                                  <span>⏱️ {formatDuration(content.estimated_duration)}</span>
                                )}
                                {contentTimeSpent > 0 && (
                                  <span>🕒 {formatTime(contentTimeSpent)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ position: 'relative' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowContentMenu(showContentMenu === content.id ? null : content.id);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#6B7280',
                                  fontSize: '1.25rem',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                ⋯
                              </button>

                              {showContentMenu === content.id && (
                                <div
                                  ref={contentMenuRef}
                                  style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '100%',
                                    backgroundColor: 'white',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '6px',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    minWidth: '180px',
                                    zIndex: 10,
                                    marginTop: '0.25rem'
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleContentClick(content);
                                      setShowContentMenu(null);
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '0.75rem 1rem',
                                      textAlign: 'left',
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: '0.875rem',
                                      color: '#374151',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                  >
                                    👁️ Voir le contenu
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditContent(content);
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '0.75rem 1rem',
                                      textAlign: 'left',
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: '0.875rem',
                                      color: '#374151',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                  >
                                    ✏️ Modifier
                                  </button>

                                  <div style={{ borderTop: '1px solid #E5E7EB', margin: '0.25rem 0' }} />

                                  <div style={{ padding: '0.5rem 1rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.5rem' }}>
                                      Changer le statut
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleChangeContentStatus(content, 0);
                                      }}
                                      style={{
                                        width: '100%',
                                        padding: '0.5rem 0.75rem',
                                        textAlign: 'left',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        color: '#F59E0B',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        borderRadius: '4px'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF3C7'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      📝 Brouillon
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleChangeContentStatus(content, 1);
                                      }}
                                      style={{
                                        width: '100%',
                                        padding: '0.5rem 0.75rem',
                                        textAlign: 'left',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        color: '#10B981',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        borderRadius: '4px'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1FAE5'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      ✓ Actif
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleChangeContentStatus(content, 2);
                                      }}
                                      style={{
                                        width: '100%',
                                        padding: '0.5rem 0.75rem',
                                        textAlign: 'left',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        color: '#6B7280',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        borderRadius: '4px'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      📦 Archivé
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
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

      {/* Enhanced Content Viewer Modal */}
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
          <div
            ref={contentViewerModalRef}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{getContentIcon(selectedContent.content_type_name || '')}</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>{selectedContent.title}</h3>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                Module {course.modules.find(m => m.contents.some(c => c.id === selectedContent.id))?.order} • {course.modules.find(m => m.contents.some(c => c.id === selectedContent.id))?.title}
              </div>
            </div>

            {/* Content Description */}
            {selectedContent.caption && (
              <div style={{ padding: '1rem 1.5rem', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>À propos du contenu</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280', lineHeight: '1.5' }}>{selectedContent.caption}</p>
              </div>
            )}

            {/* Enhanced Timer Display */}
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
                  Temps estimé : {selectedContent.estimated_duration || 15}min
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
              {selectedContent.content_type_name?.toLowerCase() === 'pdf' && (
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
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</div>
                      <div>Vidéo non disponible</div>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced QCM Content */}
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
                              backgroundColor: option.is_correct ? '#F0F9FF' : 'white',
                              border: `1px solid ${option.is_correct ? '#0EA5E9' : '#E5E7EB'}`,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            <input
                              type={question.question_type === 'single' ? 'radio' : 'checkbox'}
                              name={`question-${question.id || qIndex}`}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{
                              fontSize: '0.875rem',
                              color: option.is_correct ? '#0C4A6E' : '#374151'
                            }}>
                              {option.text}
                            </span>
                            {option.is_correct && (
                              <span style={{
                                fontSize: '0.75rem',
                                color: '#10B981',
                                marginLeft: 'auto',
                                fontWeight: '500'
                              }}>
                                ✓ Correct
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Enhanced File Download Section */}
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
                  <span style={{ fontSize: '1.5rem' }}>{getContentIcon(selectedContent.content_type_name || '')}</span>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{getFileName(selectedContent)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      {getFileSize(selectedContent)}
                      {selectedContent.estimated_duration && ` • ${formatDuration(selectedContent.estimated_duration)}`}
                    </div>
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

            {/* Enhanced Footer Actions */}
            <div style={{
              padding: '1.5rem',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                {userProgress.completedContents.includes(selectedContent.id) ? (
                  <span style={{ color: '#10B981', fontWeight: '500' }}>✓ Contenu terminé</span>
                ) : (
                  <span>Temps passé: {formatTime(userProgress.timeSpent[selectedContent.id] || 0)}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced New Module Modal */}
      {showNewModuleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div
            ref={newModuleModalRef}
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '500px'
            }}
          >
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>Créer un nouveau module</h3>
            <form onSubmit={handleCreateModule}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Titre du module *
                </label>
                <input
                  type="text"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Description
                </label>
                <textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewModuleModal(false);
                    setModuleForm({ title: '', description: '', estimated_duration: undefined, min_required_time: undefined });
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    background: '#6D6F71',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2D2B6B',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Edit Module Modal */}
      {showEditModuleModal && editingModule && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div
            ref={editModuleModalRef}
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '500px'
            }}
          >
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>Modifier le module</h3>
            <form onSubmit={handleUpdateModule}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Titre du module *
                </label>
                <input
                  type="text"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #6D6F71',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Description
                </label>
                <textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModuleModal(false);
                    setEditingModule(null);
                    setModuleForm({ title: '', description: '', estimated_duration: undefined, min_required_time: undefined });
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    background: '#6D6F71',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#F97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced New Content Modal */}
      {showNewContentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div
            ref={newContentModalRef}
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>Créer un nouveau contenu</h3>
            <form onSubmit={handleCreateContent}>
              {!selectedContentType ? (
                <div className="text-center">
                  <h6 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Choisir le type de contenu</h6>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => setSelectedContentType('pdf')}
                      style={{
                        padding: '1rem 1.5rem',
                        border: '1px solid #2D2B6B',
                        borderRadius: '6px',
                        background: 'white',
                        color: '#2D2B6B',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        minWidth: '120px'
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>📄</span>
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => setSelectedContentType('video')}
                      style={{
                        padding: '1rem 1.5rem',
                        border: '1px solid #2D2B6B',
                        borderRadius: '6px',
                        background: 'white',
                        color: '#2D2B6B',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        minWidth: '120px'
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>🎬</span>
                      <span>Vidéo</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => setSelectedContentType('qcm')}
                      style={{
                        padding: '1rem 1.5rem',
                        border: '1px solid #2D2B6B',
                        borderRadius: '6px',
                        background: 'white',
                        color: '#2D2B6B',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        minWidth: '120px'
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>✏️</span>
                      <span>Quiz QCM</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Type de contenu *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#F9FAFB', borderRadius: '4px' }}>
                      <span style={{ fontSize: '1.25rem' }}>{getContentIcon(selectedContentType)}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        {selectedContentType === 'pdf' && 'Document PDF'}
                        {selectedContentType === 'video' && 'Vidéo'}
                        {selectedContentType === 'qcm' && 'Quiz QCM'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedContentType(null)}
                        style={{
                          marginLeft: 'auto',
                          background: 'none',
                          border: 'none',
                          color: '#6B7280',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Changer
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Module *
                    </label>
                    <select
                      value={selectedModule || ''}
                      onChange={(e) => setSelectedModule(Number(e.target.value))}
                      required
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="">Sélectionner un module</option>
                      {course?.modules?.map(module => (
                        <option key={module.id} value={module.id}>
                          {module.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Titre du contenu *
                    </label>
                    <input
                      type="text"
                      value={contentForm.title}
                      onChange={(e) => setContentForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Description
                    </label>
                    <textarea
                      value={contentForm.caption}
                      onChange={(e) => setContentForm(prev => ({ ...prev, caption: e.target.value }))}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* File Upload for PDF and Video */}
                  {(selectedContentType === 'pdf' || selectedContentType === 'video') && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                        Fichier {selectedContentType === 'pdf' ? 'PDF' : 'Vidéo'} *
                      </label>
                      <input
                        type="file"
                        accept={selectedContentType === 'pdf' ? '.pdf' : 'video/*'}
                        onChange={handleFileChange}
                        required
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #D1D5DB',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  )}

                  {/* Enhanced QCM Form */}
                  {selectedContentType === 'qcm' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600' }}>Configuration du QCM</h4>
                        <button
                          type="button"
                          onClick={addQuestion}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#2D2B6B',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          + Ajouter une question
                        </button>
                      </div>

                      {contentForm.questions.map((question, qIndex) => (
                        <div key={qIndex} style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h5 style={{ fontSize: '0.875rem', fontWeight: '600', margin: 0 }}>Question {qIndex + 1}</h5>
                            {contentForm.questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeQuestion(qIndex)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#EF4444',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem'
                                }}
                              >
                                ✕ Supprimer
                              </button>
                            )}
                          </div>

                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                              Question *
                            </label>
                            <input
                              type="text"
                              value={question.question}
                              onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                              required
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #D1D5DB',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>

                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                              Type de question
                            </label>
                            <select
                              value={question.question_type}
                              onChange={(e) => handleQuestionChange(qIndex, 'question_type', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #D1D5DB',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                boxSizing: 'border-box'
                              }}
                            >
                              <option value="single">Choix unique</option>
                              <option value="multiple">Choix multiple</option>
                            </select>
                          </div>

                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Options *</label>
                              <button
                                type="button"
                                onClick={() => addOption(qIndex)}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#10B981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem'
                                }}
                              >
                                + Ajouter une option
                              </button>
                            </div>

                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                <input
                                  type={question.question_type === 'single' ? 'radio' : 'checkbox'}
                                  name={`correct-${qIndex}`}
                                  checked={option.is_correct}
                                  onChange={(e) => {
                                    if (question.question_type === 'single') {
                                      // For single choice, set all others to false
                                      const newOptions = question.options.map((opt, idx) => ({
                                        ...opt,
                                        is_correct: idx === oIndex
                                      }));
                                      handleQuestionChange(qIndex, 'options', newOptions);
                                    } else {
                                      // For multiple choice, toggle this one
                                      handleOptionChange(qIndex, oIndex, 'is_correct', e.target.checked);
                                    }
                                  }}
                                  style={{ cursor: 'pointer' }}
                                />
                                <input
                                  type="text"
                                  value={option.text}
                                  onChange={(e) => handleOptionChange(qIndex, oIndex, 'text', e.target.value)}
                                  placeholder="Texte de l'option"
                                  required
                                  style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    border: '1px solid #D1D5DB',
                                    borderRadius: '4px',
                                    fontSize: '0.875rem',
                                    boxSizing: 'border-box'
                                  }}
                                />
                                {question.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOption(qIndex, oIndex)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#EF4444',
                                      cursor: 'pointer',
                                      padding: '0.25rem'
                                    }}
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* QCM Settings */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                Points
                              </label>
                              <input
                                type="number"
                                value={contentForm.points}
                                onChange={(e) => setContentForm(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                                min="1"
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  border: '1px solid #D1D5DB',
                                  borderRadius: '4px',
                                  fontSize: '0.875rem',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                Score de passage (%)
                              </label>
                              <input
                                type="number"
                                value={contentForm.passing_score}
                                onChange={(e) => setContentForm(prev => ({ ...prev, passing_score: parseInt(e.target.value) }))}
                                min="0"
                                max="100"
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  border: '1px solid #D1D5DB',
                                  borderRadius: '4px',
                                  fontSize: '0.875rem',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                Tentatives max
                              </label>
                              <input
                                type="number"
                                value={contentForm.max_attempts}
                                onChange={(e) => setContentForm(prev => ({ ...prev, max_attempts: parseInt(e.target.value) }))}
                                min="1"
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  border: '1px solid #D1D5DB',
                                  borderRadius: '4px',
                                  fontSize: '0.875rem',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                                Limite de temps (min)
                              </label>
                              <input
                                type="number"
                                value={contentForm.time_limit}
                                onChange={(e) => setContentForm(prev => ({ ...prev, time_limit: parseInt(e.target.value) }))}
                                min="0"
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  border: '1px solid #D1D5DB',
                                  borderRadius: '4px',
                                  fontSize: '0.875rem',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewContentModal(false);
                        setSelectedContentType(null);
                        setSelectedModule(null);
                        resetContentForm();
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '4px',
                        background: '#6D6F71',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#2D2B6B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      Créer
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Edit Content Modal */}
      {showEditContentModal && editingContent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div
            ref={editContentModalRef}
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              maxWidth: '600px'
            }}
          >
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>Modifier le contenu</h3>
            <form onSubmit={handleUpdateContent}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Titre du contenu *
                </label>
                <input
                  type="text"
                  value={contentForm.title}
                  onChange={(e) => setContentForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Description
                </label>
                <textarea
                  value={contentForm.caption}
                  onChange={(e) => setContentForm(prev => ({ ...prev, caption: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* File Upload for PDF and Video */}
              {(selectedContentType === 'pdf' || selectedContentType === 'video') && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Fichier {selectedContentType === 'pdf' ? 'PDF' : 'Vidéo'} *
                  </label>
                  <input
                    type="file"
                    accept={selectedContentType === 'pdf' ? '.pdf' : 'video/*'}
                    onChange={handleFileChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                    Laissez vide pour conserver le fichier actuel
                  </div>
                </div>
              )}

              {/* Enhanced QCM Form */}
              {selectedContentType === 'qcm' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600' }}>Configuration du QCM</h4>
                    <button
                      type="button"
                      onClick={addQuestion}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#2D2B6B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      + Ajouter une question
                    </button>
                  </div>

                  {contentForm.questions.map((question, qIndex) => (
                    <div key={qIndex} style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h5 style={{ fontSize: '0.875rem', fontWeight: '600', margin: 0 }}>Question {qIndex + 1}</h5>
                        {contentForm.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(qIndex)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#EF4444',
                              cursor: 'pointer',
                              fontSize: '0.875rem'
                            }}
                          >
                            ✕ Supprimer
                          </button>
                        )}
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          Question *
                        </label>
                        <input
                          type="text"
                          value={question.question}
                          onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                          required
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #D1D5DB',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          Type de question
                        </label>
                        <select
                          value={question.question_type}
                          onChange={(e) => handleQuestionChange(qIndex, 'question_type', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #D1D5DB',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="single">Choix unique</option>
                          <option value="multiple">Choix multiple</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Options *</label>
                          <button
                            type="button"
                            onClick={() => addOption(qIndex)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#10B981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            + Ajouter une option
                          </button>
                        </div>

                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                            <input
                              type={question.question_type === 'single' ? 'radio' : 'checkbox'}
                              name={`correct-${qIndex}`}
                              checked={option.is_correct}
                              onChange={(e) => {
                                if (question.question_type === 'single') {
                                  // For single choice, set all others to false
                                  const newOptions = question.options.map((opt, idx) => ({
                                    ...opt,
                                    is_correct: idx === oIndex
                                  }));
                                  handleQuestionChange(qIndex, 'options', newOptions);
                                } else {
                                  // For multiple choice, toggle this one
                                  handleOptionChange(qIndex, oIndex, 'is_correct', e.target.checked);
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                            <input
                              type="text"
                              value={option.text}
                              onChange={(e) => handleOptionChange(qIndex, oIndex, 'text', e.target.value)}
                              placeholder="Texte de l'option"
                              required
                              style={{
                                flex: 1,
                                padding: '0.5rem',
                                border: '1px solid #D1D5DB',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                boxSizing: 'border-box'
                              }}
                            />
                            {question.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(qIndex, oIndex)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#EF4444',
                                  cursor: 'pointer',
                                  padding: '0.25rem'
                                }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* QCM Settings */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Points
                          </label>
                          <input
                            type="number"
                            value={contentForm.points}
                            onChange={(e) => setContentForm(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                            min="1"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #D1D5DB',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Score de passage (%)
                          </label>
                          <input
                            type="number"
                            value={contentForm.passing_score}
                            onChange={(e) => setContentForm(prev => ({ ...prev, passing_score: parseInt(e.target.value) }))}
                            min="0"
                            max="100"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #D1D5DB',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Tentatives max
                          </label>
                          <input
                            type="number"
                            value={contentForm.max_attempts}
                            onChange={(e) => setContentForm(prev => ({ ...prev, max_attempts: parseInt(e.target.value) }))}
                            min="1"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #D1D5DB',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                            Limite de temps (min)
                          </label>
                          <input
                            type="number"
                            value={contentForm.time_limit}
                            onChange={(e) => setContentForm(prev => ({ ...prev, time_limit: parseInt(e.target.value) }))}
                            min="0"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #D1D5DB',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditContentModal(false);
                    setEditingContent(null);
                    resetContentForm();
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    background: '#6D6F71',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#F97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;