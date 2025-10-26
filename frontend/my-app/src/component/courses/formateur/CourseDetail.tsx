import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api/api';

interface Content {
  id: number;
  title: string;
  content_type: string;
  caption?: string;
  order: number;
  status: number;
  estimated_duration?: number;
  min_required_time?: number;
  video_content?: {
    video_file: string;
    duration?: number;
  };
  pdf_content?: {
    pdf_file: string;
    page_count?: number;
  };
  qcm?: any;
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
  creator: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
  estimated_duration?: number;
  min_required_time?: number;
  modules: Module[];
}

const FormationDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showNewModuleModal, setShowNewModuleModal] = useState(false);
  const [showNewContentModal, setShowNewContentModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<'pdf' | 'video' | 'qcm' | null>(null);
  const [viewContentModal, setViewContentModal] = useState<Content | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [showEditContentModal, setShowEditContentModal] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [showContentMenu, setShowContentMenu] = useState<number | null>(null);
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);

  // Form states
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
  const [contentForm, setContentForm] = useState({ 
    title: '', 
    caption: '', 
    file: null as File | null,
    question: '',
    question_type: 'single',
    options: [] as any[],
    points: 1,
    passing_score: 80,
    max_attempts: 3,
    time_limit: 0
  });

  const courseId = React.useMemo(() => {
    if (!id) return null;
    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? null : parsed;
  }, [id]);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId || isNaN(courseId)) {
        setError(`Invalid course ID: ${id}`);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const [courseResponse, modulesResponse] = await Promise.all([
          api.get(`courses/${courseId}/`),
          api.get(`courses/${courseId}/modules/`)
        ]);

        const course = courseResponse.data;
        const modules = Array.isArray(modulesResponse.data) ? modulesResponse.data : [];

        const transformedCourse: Course = {
          id: course.id,
          title_of_course: course.title_of_course || 'No Title',
          description: course.description || 'No description available',
          image: course.image,
          status: course.status ?? 1,
          department: course.department,
          category: course.category,
          creator: course.creator || { 
            id: 0, 
            username: 'Unknown', 
            first_name: 'Unknown', 
            last_name: 'User' 
          },
          created_at: course.created_at,
          updated_at: course.updated_at,
          estimated_duration: course.estimated_duration,
          min_required_time: course.min_required_time,
          modules: modules.map((module: any) => ({
            id: module.id,
            title: module.title || 'Untitled Module',
            description: module.description,
            order: module.order ?? 0,
            status: module.status ?? 1,
            contents: Array.isArray(module.contents) ? module.contents : []
          }))
        };

        setCourseData(transformedCourse);
        setError(null);

      } catch (error: any) {
        console.error('Error fetching course data:', error);
        
        if (error.response) {
          setError(`Course not found (Error ${error.response.status})`);
        } else if (error.request) {
          setError('No response from server. Please check your connection.');
        } else {
          setError(`Request error: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, id]);

  // Timer for content viewing
  useEffect(() => {
    if (viewContentModal) {
      setTimeElapsed(0);
      const interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
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
    }
  }, [viewContentModal]);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseId || !moduleForm.title.trim()) {
      alert('Please enter a module title');
      return;
    }

    try {
      await api.post(`courses/${courseId}/modules/`, {
        title: moduleForm.title,
        description: moduleForm.description,
        order: (courseData?.modules.length || 0) + 1,
        status: 1
      });

      const modulesResponse = await api.get(`courses/${courseId}/modules/`);
      setCourseData(prev => prev ? {
        ...prev,
        modules: modulesResponse.data
      } : null);
      
      setShowNewModuleModal(false);
      setModuleForm({ title: '', description: '' });
      alert('Module created successfully!');
    } catch (error: any) {
      console.error('Failed to create module:', error);
      alert(`Failed to create module: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseId || !selectedModule || !selectedContentType || !contentForm.title.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      let endpoint = '';
      let requestData: any;
      let headers: any = {};

      if (selectedContentType === 'pdf') {
        if (!contentForm.file) {
          alert('Please select a PDF file');
          return;
        }
        endpoint = `courses/${courseId}/modules/${selectedModule}/contents/pdf/`;
        const formData = new FormData();
        formData.append('title', contentForm.title);
        formData.append('caption', contentForm.caption || '');
        formData.append('order', '1');
        formData.append('status', '1');
        formData.append('pdf_file', contentForm.file);
        requestData = formData;
        headers = { 'Content-Type': 'multipart/form-data' };
      } else if (selectedContentType === 'video') {
        if (!contentForm.file) {
          alert('Please select a video file');
          return;
        }
        endpoint = `courses/${courseId}/modules/${selectedModule}/contents/video/`;
        const formData = new FormData();
        formData.append('title', contentForm.title);
        formData.append('caption', contentForm.caption || '');
        formData.append('order', '1');
        formData.append('status', '1');
        formData.append('video_file', contentForm.file);
        requestData = formData;
        headers = { 'Content-Type': 'multipart/form-data' };
      } else if (selectedContentType === 'qcm') {
        endpoint = `courses/${courseId}/modules/${selectedModule}/contents/qcm/`;
        requestData = {
          title: contentForm.title,
          caption: contentForm.caption || '',
          order: 1,
          status: 1,
          qcm_question: contentForm.question,
          question_type: contentForm.question_type,
          qcm_options: contentForm.options,
          points: contentForm.points,
          passing_score: contentForm.passing_score,
          max_attempts: contentForm.max_attempts,
          time_limit: contentForm.time_limit
        };
        headers = { 'Content-Type': 'application/json' };
      }

      await api.post(endpoint, requestData, { headers });

      const modulesResponse = await api.get(`courses/${courseId}/modules/`);
      setCourseData(prev => prev ? {
        ...prev,
        modules: modulesResponse.data
      } : null);
      
      setShowNewContentModal(false);
      setSelectedContentType(null);
      setSelectedModule(null);
      setContentForm({ 
        title: '', 
        caption: '', 
        file: null,
        question: '',
        question_type: 'single',
        options: [],
        points: 1,
        passing_score: 80,
        max_attempts: 3,
        time_limit: 0
      });
      alert('Content created successfully!');
    } catch (error: any) {
      console.error('Failed to create content:', error);
      alert(`Failed to create content: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setContentForm(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleContentClick = (content: Content) => {
    setViewContentModal(content);
  };

  const handleMarkCompleted = async () => {
    if (!viewContentModal || !courseId) return;
    
    try {
      await api.post(`courses/${courseId}/complete-content/`, {
        content_id: viewContentModal.id,
        time_spent: timeElapsed
      });
      
      alert('Content marked as completed!');
      setViewContentModal(null);
      
      // Refresh course data
      const modulesResponse = await api.get(`courses/${courseId}/modules/`);
      setCourseData(prev => prev ? {
        ...prev,
        modules: modulesResponse.data
      } : null);
    } catch (error) {
      console.error('Failed to mark content as completed:', error);
      alert('Failed to mark as completed. Please try again.');
    }
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleForm({ title: module.title, description: module.description || '' });
    setShowEditModuleModal(true);
  };

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseId || !editingModule || !moduleForm.title.trim()) {
      alert('Please enter a module title');
      return;
    }

    try {
      await api.put(`courses/${courseId}/modules/${editingModule.id}/`, {
        title: moduleForm.title,
        description: moduleForm.description
      });

      const modulesResponse = await api.get(`courses/${courseId}/modules/`);
      setCourseData(prev => prev ? {
        ...prev,
        modules: modulesResponse.data
      } : null);
      
      setShowEditModuleModal(false);
      setEditingModule(null);
      setModuleForm({ title: '', description: '' });
      alert('Module updated successfully!');
    } catch (error: any) {
      console.error('Failed to update module:', error);
      alert(`Failed to update module: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleEditContent = (content: Content) => {
    setEditingContent(content);
    setContentForm({
      title: content.title,
      caption: content.caption || '',
      file: null,
      question: '',
      question_type: 'single',
      options: [],
      points: 1,
      passing_score: 80,
      max_attempts: 3,
      time_limit: content.estimated_duration || 0
    });
    setSelectedContentType(content.content_type.toLowerCase() as 'pdf' | 'video' | 'qcm');
    setShowEditContentModal(true);
    setShowContentMenu(null);
  };

  const handleUpdateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseId || !editingContent || !contentForm.title.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      let endpoint = '';
      let requestData: any;
      let headers: any = {};

      if (editingContent.content_type.toLowerCase() === 'pdf') {
        endpoint = `courses/${courseId}/contents/pdf/${editingContent.id}/`;
        if (contentForm.file) {
          const formData = new FormData();
          formData.append('title', contentForm.title);
          formData.append('caption', contentForm.caption || '');
          formData.append('pdf_file', contentForm.file);
          requestData = formData;
          headers = { 'Content-Type': 'multipart/form-data' };
        } else {
          requestData = {
            title: contentForm.title,
            caption: contentForm.caption || ''
          };
          headers = { 'Content-Type': 'application/json' };
        }
      } else if (editingContent.content_type.toLowerCase() === 'video') {
        endpoint = `courses/${courseId}/contents/video/${editingContent.id}/`;
        if (contentForm.file) {
          const formData = new FormData();
          formData.append('title', contentForm.title);
          formData.append('caption', contentForm.caption || '');
          formData.append('video_file', contentForm.file);
          requestData = formData;
          headers = { 'Content-Type': 'multipart/form-data' };
        } else {
          requestData = {
            title: contentForm.title,
            caption: contentForm.caption || ''
          };
          headers = { 'Content-Type': 'application/json' };
        }
      } else if (editingContent.content_type.toLowerCase() === 'qcm') {
        endpoint = `courses/${courseId}/contents/qcm/${editingContent.id}/`;
        requestData = {
          title: contentForm.title,
          caption: contentForm.caption || '',
          qcm_question: contentForm.question,
          question_type: contentForm.question_type,
          points: contentForm.points
        };
        headers = { 'Content-Type': 'application/json' };
      }

      await api.put(endpoint, requestData, { headers });

      const modulesResponse = await api.get(`courses/${courseId}/modules/`);
      setCourseData(prev => prev ? {
        ...prev,
        modules: modulesResponse.data
      } : null);
      
      setShowEditContentModal(false);
      setEditingContent(null);
      setSelectedContentType(null);
      setContentForm({ 
        title: '', 
        caption: '', 
        file: null,
        question: '',
        question_type: 'single',
        options: [],
        points: 1,
        passing_score: 80,
        max_attempts: 3,
        time_limit: 0
      });
      alert('Content updated successfully!');
    } catch (error: any) {
      console.error('Failed to update content:', error);
      alert(`Failed to update content: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleChangeContentStatus = async (content: Content, newStatus: number) => {
    if (!courseId) return;
    
    try {
      await api.patch(`courses/${courseId}/contents/${content.id}/update-status/`, {
        status: newStatus
      });

      const modulesResponse = await api.get(`courses/${courseId}/modules/`);
      setCourseData(prev => prev ? {
        ...prev,
        modules: modulesResponse.data
      } : null);
      
      setShowContentMenu(null);
      alert('Status updated successfully!');
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const getFileUrl = (fileUrl: string) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    if (fileUrl.startsWith('/media/')) {
      return `${api.defaults.baseURL}${fileUrl}`;
    }
    return `${api.defaults.baseURL}/media/${fileUrl}`;
  };

  const getContentIcon = (contentType: string): string => {
    switch (contentType?.toLowerCase()) {
      case 'video': return '🎥';
      case 'pdf': case 'document': return '📄';
      case 'qcm': return '📝';
      case 'audio': return '🎵';
      default: return '📄';
    }
  };

  const getStatusLabel = (status: number): string => {
    switch (status) {
      case 0: return 'Brouillon';
      case 1: return 'Actif';
      case 2: return 'Archivé';
      default: return 'Actif';
    }
  };

  const getStatusColor = (status: number): string => {
    switch (status) {
      case 0: return '#F59E0B';
      case 1: return '#10B981';
      case 2: return '#6B7280';
      default: return '#10B981';
    }
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

  const formatTime = (minutes?: number): string => {
    if (!minutes) return '0min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}min`;
    return `${mins}min`;
  };

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const calculateStats = () => {
    if (!courseData) return null;

    const totalContent = courseData.modules.reduce((total, module) => 
      total + (module.contents?.length || 0), 0
    );

    return {
      totalContent,
      modules: courseData.modules.length,
      learners: 0,
      avgProgress: 0,
      yourProgress: 0,
      estimatedTime: formatTime(courseData.estimated_duration)
    };
  };

  const getFileSize = (content: Content): string => {
    // Mock file size - you would get this from your backend
    if (content.content_type?.toLowerCase() === 'pdf') {
      return '2.6MB';
    } else if (content.content_type?.toLowerCase() === 'video') {
      return '26.8MB';
    }
    return '';
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

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F3F4F6', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Loading course details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: '#F3F4F6', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem', color: '#DC2626' }}>Error loading course</div>
          <div style={{ fontSize: '1rem', color: '#6B7280', marginBottom: '2rem' }}>{error}</div>
          <button 
            onClick={() => navigate(-1)}
            style={{
              backgroundColor: '#2D2B6B',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div style={{ backgroundColor: '#F3F4F6', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem' }}>Course not found</div>
          <button 
            onClick={() => navigate(-1)}
            style={{
              backgroundColor: '#2D2B6B',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ← Retour aux formations
          </button>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div style={{ backgroundColor: '#F3F4F6', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#2D2B6B', color: 'white', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>{courseData.title_of_course}</h1>
          <span style={{ 
            backgroundColor: getStatusColor(courseData.status), 
            color: 'white', 
            padding: '0.25rem 0.75rem', 
            borderRadius: '12px', 
            fontSize: '0.75rem'
          }}>
            {getStatusLabel(courseData.status)}
          </span>
        </div>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.9 }}>{courseData.description}</p>
      </div>

      {/* Stats Bar */}
      <div style={{ backgroundColor: '#2D2B6B', padding: '0 2rem 2rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '2rem', color: 'white' }}>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Contenu total</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>0{stats?.totalContent || 0}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>N° de modules</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>0{stats?.modules || 0}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>N° d'apprenants</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.learners || 0}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Avg. du progrès</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.avgProgress || 0}%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Votre progrès</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.yourProgress || 0}%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Temps estimé</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.estimatedTime || '0min'}</div>
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
            {courseData.image ? (
              <img src={courseData.image} alt="Course" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
                <div style={{ fontSize: '3rem' }}>📚</div>
                <div style={{ fontSize: '0.875rem' }}>Course Image</div>
              </div>
            )}
          </div>

          {(courseData.department || courseData.category) && (
            <div style={{ 
              backgroundColor: '#FED7AA', 
              color: '#9A3412', 
              padding: '0.5rem 1rem', 
              borderRadius: '20px', 
              fontSize: '0.875rem',
              display: 'inline-block',
              marginBottom: '1rem'
            }}>
              {courseData.department || courseData.category}
            </div>
          )}

          <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: '1.6', marginBottom: '1rem' }}>
            {courseData.description}
          </p>

          <div style={{ marginBottom: '0.5rem' }}>
            <span>👤 </span>
            <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Créée par</span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '1rem' }}>
            {courseData.creator.first_name} {courseData.creator.last_name}
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <span>📅 </span>
            <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Créée le</span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
            {formatDate(courseData.created_at)}
          </div>
        </div>

        {/* Right Content - Modules */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1.5rem' }}>
            <button 
              onClick={() => setShowEditCourseModal(true)}
              style={{
                backgroundColor: '#F97316',
                color: 'white',
                border: 'none',
                padding: '0.625rem 1.25rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ✏️ Modifier la formation
            </button>
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

          {courseData.modules && courseData.modules.length > 0 ? (
            courseData.modules.map((module) => (
              <div key={module.id} style={{ marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                      Module {module.order} • {module.title}
                    </h3>
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
                        style={{ color: '#2D2B6B', cursor: 'pointer', background: 'none', border: 'none', fontSize: '0.875rem', fontWeight: '500', padding: 0 }}
                        onClick={() => {
                          setSelectedModule(module.id);
                          setShowNewContentModal(true);
                        }}
                      >
                        + nouveau contenu
                      </button>
                    </div>
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
                              {formatTime(content.estimated_duration)}
                            </span>
                          )}
                          {content.is_completed && (
                            <span style={{ fontSize: '0.875rem', color: '#10B981', fontWeight: '500' }}>
                              ✓ Complété
                            </span>
                          )}
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
                                    setViewContentModal(content);
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
      {viewContentModal && (
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
                <span style={{ fontSize: '1.5rem' }}>{getContentIcon(viewContentModal.content_type)}</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>{viewContentModal.title}</h3>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                Module {courseData.modules.find(m => m.contents.some(c => c.id === viewContentModal.id))?.order} • {courseData.modules.find(m => m.contents.some(c => c.id === viewContentModal.id))?.title}
              </div>
            </div>

            {/* Time Required Banner */}
            {viewContentModal.min_required_time && (
              <div style={{ 
                backgroundColor: '#FEF3C7', 
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #E5E7EB'
              }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400E' }}>
                  <strong>Temps requis :</strong> Vous devez passer {viewContentModal.min_required_time} minutes ou plus dans ce cours avant de pouvoir marquer le contenu comme terminé.
                </p>
              </div>
            )}

            {/* Content Description */}
            {viewContentModal.caption && (
              <div style={{ padding: '1rem 1.5rem', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>À propos du contenu</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280', lineHeight: '1.5' }}>{viewContentModal.caption}</p>
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
                  Temps estimé de lecture : {viewContentModal.estimated_duration || 15}min
                </span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#4338CA' }}>
                {formatTimer(timeElapsed)} / {formatTimer((viewContentModal.estimated_duration || 15) * 60)}
              </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem' }}>Contenu à lire</h4>

              {/* PDF Content */}
              {viewContentModal.content_type?.toLowerCase() === 'pdf' && viewContentModal.pdf_content && (
                <div>
                  <iframe 
                    src={getFileUrl(viewContentModal.pdf_content.pdf_file)}
                    style={{
                      width: '100%',
                      height: '500px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      backgroundColor: '#000'
                    }}
                    title={viewContentModal.title}
                  />
                </div>
              )}

              {/* Video Content */}
              {viewContentModal.content_type?.toLowerCase() === 'video' && viewContentModal.video_content && (
                <div>
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
                    <source src={getFileUrl(viewContentModal.video_content.video_file)} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* QCM Content */}
              {viewContentModal.content_type?.toLowerCase() === 'qcm' && viewContentModal.qcm && (
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB'
                }}>
                  <h5 style={{ marginBottom: '1rem', fontSize: '1rem' }}>{viewContentModal.qcm.question}</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {viewContentModal.qcm.options?.map((option: any, index: number) => (
                      <label 
                        key={index}
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
                        <input type="radio" name="quiz-option" />
                        <span style={{ fontSize: '0.875rem' }}>{option.text}</span>
                      </label>
                    ))}
                  </div>
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
                  <span style={{ fontSize: '1.5rem' }}>{getContentIcon(viewContentModal.content_type)}</span>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{getFileName(viewContentModal)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{getFileSize(viewContentModal)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {(viewContentModal.pdf_content || viewContentModal.video_content) && (
                    <>
                      <a
                        href={getFileUrl(viewContentModal.pdf_content?.pdf_file || viewContentModal.video_content?.video_file || '')}
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
                        Ouvrir
                      </a>
                      <span style={{ color: '#E5E7EB' }}>•</span>
                      <a
                        href={getFileUrl(viewContentModal.pdf_content?.pdf_file || viewContentModal.video_content?.video_file || '')}
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
                onClick={() => setViewContentModal(null)}
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
                onClick={handleMarkCompleted}
                disabled={viewContentModal.min_required_time ? timeElapsed < (viewContentModal.min_required_time * 60) : false}
                style={{
                  padding: '0.625rem 1.5rem',
                  backgroundColor: (viewContentModal.min_required_time && timeElapsed < (viewContentModal.min_required_time * 60)) ? '#9CA3AF' : '#4338CA',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: (viewContentModal.min_required_time && timeElapsed < (viewContentModal.min_required_time * 60)) ? 'not-allowed' : 'pointer',
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

      {/* Edit Course Modal */}
      {showEditCourseModal && (
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
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
              Modifier la formation
            </h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              // Handle course update
              try {
                if (!courseId) return;
                
                const formData = new FormData(e.currentTarget);
                await api.put(`courses/${courseId}/`, {
                  title_of_course: formData.get('title'),
                  description: formData.get('description'),
                  department: formData.get('department'),
                  category: formData.get('category')
                });
                
                // Refresh course data
                const courseResponse = await api.get(`courses/${courseId}/`);
                const modulesResponse = await api.get(`courses/${courseId}/modules/`);
                
                setCourseData({
                  ...courseResponse.data,
                  modules: modulesResponse.data
                });
                
                setShowEditCourseModal(false);
                alert('Formation modifiée avec succès!');
              } catch (error) {
                console.error('Failed to update course:', error);
                alert('Échec de la modification. Veuillez réessayer.');
              }
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Titre de la formation *
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={courseData?.title_of_course}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
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
                  name="description"
                  defaultValue={courseData?.description}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Département
                  </label>
                  <input
                    type="text"
                    name="department"
                    defaultValue={courseData?.department}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Catégorie
                  </label>
                  <input
                    type="text"
                    name="category"
                    defaultValue={courseData?.category}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                justifyContent: 'flex-end',
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #E5E7EB'
              }}>
                <button
                  type="button"
                  onClick={() => setShowEditCourseModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6B7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#F97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
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

      {/* New Module Modal */}
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
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px'
          }}>
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
              <div style={{ marginBottom: '1.5rem' }}>
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
                    setModuleForm({ title: '', description: '' });
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    background: 'white',
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

      {/* New Content Modal */}
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
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>Ajouter du contenu</h3>
            {!selectedContentType ? (
              <div>
                <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6B7280' }}>Sélectionnez le type de contenu:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button 
                    onClick={() => setSelectedContentType('pdf')}
                    style={{
                      padding: '1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      background: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    📄 PDF Document
                  </button>
                  <button 
                    onClick={() => setSelectedContentType('video')}
                    style={{
                      padding: '1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      background: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    🎥 Vidéo
                  </button>
                  <button 
                    onClick={() => setSelectedContentType('qcm')}
                    style={{
                      padding: '1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      background: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    📝 Quiz (QCM)
                  </button>
                </div>
                <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                  <button 
                    onClick={() => {
                      setShowNewContentModal(false);
                      setSelectedModule(null);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateContent} style={{ maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
                {/* Section 1: Informations générales */}
                <div style={{ backgroundColor: '#E5E7EB', padding: '0.75rem 1rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    1. Informations générales
                  </h4>
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
                    placeholder="Entrez le titre du contenu"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Description
                  </label>
                  <textarea
                    value={contentForm.caption}
                    onChange={(e) => setContentForm(prev => ({ ...prev, caption: e.target.value }))}
                    rows={4}
                    placeholder="Ajoutez une description..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Section 2: Configuration du temps */}
                <div style={{ backgroundColor: '#E5E7EB', padding: '0.75rem 1rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    2. Configuration du temps
                  </h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Durée estimée *
                    </label>
                    <input
                      type="number"
                      value={contentForm.time_limit || ''}
                      onChange={(e) => setContentForm(prev => ({ ...prev, time_limit: parseInt(e.target.value) || 0 }))}
                      placeholder="15"
                      min="0"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Temps min requis *
                    </label>
                    <input
                      type="number"
                      value={contentForm.max_attempts || ''}
                      onChange={(e) => setContentForm(prev => ({ ...prev, max_attempts: parseInt(e.target.value) || 0 }))}
                      placeholder="12"
                      min="0"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Choisissez une durée *
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {[5, 10, 15, 20, 30].map((duration) => (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => setContentForm(prev => ({ ...prev, time_limit: duration }))}
                        style={{
                          padding: '0.625rem 1.25rem',
                          backgroundColor: contentForm.time_limit === duration ? '#EEF2FF' : 'white',
                          border: `2px solid ${contentForm.time_limit === duration ? '#4338CA' : '#D1D5DB'}`,
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          color: contentForm.time_limit === duration ? '#4338CA' : '#6B7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        {contentForm.time_limit === duration && <span>✓</span>}
                        {duration} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note informative */}
                <div style={{ 
                  backgroundColor: '#DBEAFE', 
                  border: '1px solid #93C5FD',
                  padding: '1rem', 
                  borderRadius: '6px',
                  marginBottom: '1.5rem'
                }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#1E40AF', lineHeight: '1.5' }}>
                    <strong>Note :</strong> Prévoyez suffisamment de temps pour lire attentivement les questions et réfléchir. Les questions complexes peuvent nécessiter plus de temps.
                  </p>
                </div>

                {/* Section 3: Données du contenu */}
                <div style={{ backgroundColor: '#E5E7EB', padding: '0.75rem 1rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    3. Données du contenu
                  </h4>
                </div>

                {/* PDF Upload */}
                {selectedContentType === 'pdf' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div 
                      style={{
                        border: '2px dashed #D1D5DB',
                        borderRadius: '8px',
                        padding: '2rem',
                        textAlign: 'center',
                        backgroundColor: '#F9FAFB',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#4338CA';
                        e.currentTarget.style.backgroundColor = '#EEF2FF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#D1D5DB';
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }}
                      onClick={() => document.getElementById('pdf-upload')?.click()}
                    >
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📄</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                        Charger un PDF
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        Les formats supportés : PDF
                      </div>
                      <input
                        id="pdf-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        required
                        style={{ display: 'none' }}
                      />
                    </div>
                    {contentForm.file && (
                      <div style={{ 
                        marginTop: '0.75rem', 
                        padding: '0.75rem', 
                        backgroundColor: '#EEF2FF',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>📄</span>
                          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{contentForm.file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setContentForm(prev => ({ ...prev, file: null }))}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#DC2626',
                            cursor: 'pointer',
                            fontSize: '1.25rem'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Video Upload */}
                {selectedContentType === 'video' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div 
                      style={{
                        border: '2px dashed #D1D5DB',
                        borderRadius: '8px',
                        padding: '2rem',
                        textAlign: 'center',
                        backgroundColor: '#F9FAFB',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#4338CA';
                        e.currentTarget.style.backgroundColor = '#EEF2FF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#D1D5DB';
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }}
                      onClick={() => document.getElementById('video-upload')?.click()}
                    >
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎥</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                        Charger une vidéo
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        Les formats supportés : MP4, AVI, MOV
                      </div>
                      <input
                        id="video-upload"
                        type="file"
                        accept="video/*,.mp4,.avi,.mov"
                        onChange={handleFileChange}
                        required
                        style={{ display: 'none' }}
                      />
                    </div>
                    {contentForm.file && (
                      <div style={{ 
                        marginTop: '0.75rem', 
                        padding: '0.75rem', 
                        backgroundColor: '#EEF2FF',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>🎥</span>
                          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{contentForm.file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setContentForm(prev => ({ ...prev, file: null }))}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#DC2626',
                            cursor: 'pointer',
                            fontSize: '1.25rem'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* QCM Fields */}
                {selectedContentType === 'qcm' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                        Question *
                      </label>
                      <textarea
                        value={contentForm.question}
                        onChange={(e) => setContentForm(prev => ({ ...prev, question: e.target.value }))}
                        required
                        rows={3}
                        placeholder="Entrez la question du quiz..."
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                        Type de question
                      </label>
                      <select
                        value={contentForm.question_type}
                        onChange={(e) => setContentForm(prev => ({ ...prev, question_type: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="single">Choix unique</option>
                        <option value="multiple">Choix multiples</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                        Points
                      </label>
                      <input
                        type="number"
                        value={contentForm.points}
                        onChange={(e) => setContentForm(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                        min="1"
                        placeholder="1"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #D1D5DB',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  justifyContent: 'flex-end', 
                  marginTop: '2rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid #E5E7EB'
                }}>
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedContentType(null);
                      setContentForm({ 
                        title: '', 
                        caption: '', 
                        file: null,
                        question: '',
                        question_type: 'single',
                        options: [],
                        points: 1,
                        passing_score: 80,
                        max_attempts: 3,
                        time_limit: 0
                      });
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '6px',
                      background: '#6B7280',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    Fermer
                  </button>
                  <button 
                    type="submit"
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#2D2B6B',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormationDetailsPage;