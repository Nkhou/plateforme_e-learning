import React, { useEffect, useState } from 'react';
import api from '../../../api/api';
import ViewContentModal from './ViewContentModal'
import CircularStatsDisplay from './CircularStatsDisplay'
import QuizComponent from './QuizComponent'

interface CourseDetailProps {
    courseId: number | null;
    onClose: () => void;
    onEditCourse: (courseId: number) => void;
}

interface CourseDetailData {
    id: number;
    title_of_course: string;
    description: string;
    image: string;
    creator_username: string;
    creator_first_name: string;
    creator_last_name: string;
    created_at: string;
    updated_at: string;
}

interface Module {
    id: number;
    title: string;
    description: string;
    order: number;
    course: number;
    created_at: string;
    updated_at: string;
    contents?: CourseContent[];
    content_stats?: CourseStats;
}

interface QCMOption {
    id: number;
    text: string;
    is_correct: boolean;
}

interface QCMData {
    id: number;
    question: string;
    question_type: 'single' | 'multiple';
    options: QCMOption[];
    points: number;
    passing_score: number;
    max_attempts: number;
    time_limit: number;
}

export interface CourseContent {
    id: number;
    title: string;
    caption: string;
    order: number;
    content_type: string;
    content_type_name: string;
    module: number;
    pdf_content?: {
        id: number;
        pdf_file: string;
    };
    video_content?: {
        id: number;
        video_file: string;
    };
    qcm?: QCMData;
    created_at: string;
    updated_at: string;
    is_completed?: boolean;
    can_access?: boolean;
}

export interface CourseStats {
    total_users_enrolled: number;
    total_users_completed: number;
    total_courses_completed: number;
    total_modules: number;
    total_contents_course: number;
    completion_rate: number;
    average_progress: number;
    total_contents_module: number;
    pdf_count: number;
    video_count: number;
    qcm_count: number;
}

interface QuizAttempt {
    id: number;
    user: number;
    qcm_content: number;
    score: number;
    passed: boolean;
    completed_at: string;
    answers: QuizAnswer[];
}

interface QuizAnswer {
    id: number;
    attempt: number;
    question: number;
    selected_options: number[];
    is_correct: boolean;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ courseId, onClose, onEditCourse }) => {
    const [course, setCourse] = useState<CourseDetailData | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showNewContentModal, setShowNewContentModal] = useState(false);
    const [showNewModuleModal, setShowNewModuleModal] = useState(false);
    const [selectedContentType, setSelectedContentType] = useState<'pdf' | 'Video' | 'QCM' | null>(null);
    const [selectedModule, setSelectedModule] = useState<number | null>(null);
    const [selectedQuizContent, setSelectedQuizContent] = useState<CourseContent | null>(null);
    const [viewContentModal, setViewContentModal] = useState<CourseContent | null>(null);

    const [newContentData, setNewContentData] = useState({
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
        time_limit: 0
    });

    const [newModuleData, setNewModuleData] = useState({
        title: '',
        description: '',
    });

    const [selectedContent, setSelectedContent] = useState<CourseContent | null>(null);
    const [selectedModuleForEdit, setSelectedModuleForEdit] = useState<Module | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [moduleEditMode, setModuleEditMode] = useState(false);
    const [expandedModules, setExpandedModules] = useState<number[]>([]);

    const getImageUrl = (imageUrl: string) => {
        if (!imageUrl) return '/group.avif';
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }
        if (imageUrl.startsWith('/media/')) {
            return `http://localhost:8000${imageUrl}`;
        }
        return `http://localhost:8000/media/${imageUrl}`;
    };

    const getFileUrl = (fileUrl: string) => {
        if (!fileUrl) return '';
        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
            return fileUrl;
        }
        if (fileUrl.startsWith('/media/')) {
            return `http://localhost:8000${fileUrl}`;
        }
        return `http://localhost:8000/media/${fileUrl}`;
    };

    const getContentIcon = (contentType: string) => {
        switch (contentType) {
            case 'pdf': return 'fas fa-file-pdf text-danger';
            case 'video': return 'fas fa-video text-success';
            case 'qcm': return 'fas fa-question-circle text-warning';
            default: return 'fas fa-file text-secondary';
        }
    };

    useEffect(() => {
        const fetchCourseData = async () => {
            if (!courseId) return;

            try {
                setLoading(true);
                const [courseResponse, modulesResponse] = await Promise.all([
                    api.get(`courses/${courseId}/`),
                    api.get(`courses/${courseId}/modules/`),
                ]);

                setCourse(courseResponse.data);
                setModules(modulesResponse.data);
            } catch (error: any) {
                console.error('Failed to fetch course data:', error);
                setError('Failed to load course details');
            } finally {
                setLoading(false);
            }
        };

        fetchCourseData();
    }, [courseId]);

    const fetchModules = async () => {
        if (!courseId) return;
        try {
            const response = await api.get(`courses/${courseId}/modules/`);
            setModules(response.data);
        } catch (error) {
            console.error('Failed to fetch modules:', error);
        }
    };

    const handleCreateModule = async () => {
        try {
            if (!courseId) return;

            const response = await api.post(`courses/${courseId}/modules/`, {
                ...newModuleData,
                order: modules.length + 1
            });

            setModules([...modules, { ...response.data, contents: [] }]);
            setShowNewModuleModal(false);
            setNewModuleData({ title: '', description: '' });
            alert('Module created successfully!');

        } catch (error) {
            console.error('Failed to create module:', error);
            alert('Failed to create module. Please try again.');
        }
    };

    const handleUpdateModule = async () => {
        try {
            if (!selectedModuleForEdit || !courseId) return;

            const response = await api.put(`courses/${courseId}/modules/${selectedModuleForEdit.id}/`, newModuleData);

            const currentContents = selectedModuleForEdit.contents || [];
            setModules(modules.map(module =>
                module.id === selectedModuleForEdit.id
                    ? { ...response.data, contents: currentContents }
                    : module
            ));
            setShowNewModuleModal(false);
            setSelectedModuleForEdit(null);
            setNewModuleData({ title: '', description: '' });
            alert('Module updated successfully!');

        } catch (error) {
            console.error('Failed to update module:', error);
            alert('Failed to update module. Please try again.');
        }
    };

    const handleDeleteModule = async (moduleId: number) => {
        if (!window.confirm('Are you sure you want to delete this module? All contents within will also be deleted.')) {
            return;
        }

        try {
            await api.delete(`courses/${courseId}/modules/${moduleId}/`);
            setModules(modules.filter(module => module.id !== moduleId));
            alert('Module deleted successfully!');
        } catch (error) {
            console.error('Failed to delete module:', error);
            alert('Failed to delete module. Please try again.');
        }
    };

    const handleCreateContent = async () => {
        try {
            if (!courseId || !selectedModule) return;

            let endpoint = '';
            let requestData: any;

            if (selectedContentType === 'pdf') {
                endpoint = `courses/${courseId}/modules/${selectedModule}/contents/pdf/`;
                const formData = new FormData();
                formData.append('title', newContentData.title);
                formData.append('caption', newContentData.caption);
                formData.append('order', '1');
                formData.append('module', selectedModule.toString());

                if (newContentData.file) {
                    formData.append('pdf_file', newContentData.file);
                } else {
                    alert('❌ Please select a PDF file');
                    return;
                }

                requestData = formData;
            } else if (selectedContentType === 'Video') {
                endpoint = `courses/${courseId}/modules/${selectedModule}/contents/video/`;
                const formData = new FormData();
                formData.append('title', newContentData.title);
                formData.append('caption', newContentData.caption);
                formData.append('order', '1');
                formData.append('module', selectedModule.toString());

                if (newContentData.file) {
                    formData.append('video_file', newContentData.file);
                } else {
                    alert('❌ Please select a video file');
                    return;
                }

                requestData = formData;
            } else if (selectedContentType === 'QCM') {
                endpoint = `courses/${courseId}/modules/${selectedModule}/contents/qcm/`;
                requestData = {
                    title: newContentData.title,
                    caption: newContentData.caption,
                    order: 1,
                    module: selectedModule,
                    qcm_question: newContentData.questions[0].question,
                    question_type: newContentData.questions[0].question_type,
                    qcm_options: newContentData.questions[0].options.map((option: any) => ({
                        text: option.text,
                        is_correct: option.is_correct
                    })),
                    points: newContentData.points,
                    passing_score: newContentData.passing_score,
                    max_attempts: newContentData.max_attempts,
                    time_limit: newContentData.time_limit
                };
            }

            let response;
            if (selectedContentType === 'QCM') {
                response = await api.post(endpoint, requestData, {
                    headers: { 'Content-Type': 'application/json' },
                });
            } else {
                response = await api.post(endpoint, requestData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            alert(`✅ ${selectedContentType?.toUpperCase()} content created successfully!`);
            await fetchModules();

            setShowNewContentModal(false);
            setSelectedContentType(null);
            setSelectedModule(null);
            setNewContentData({
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
                time_limit: 0
            });

        } catch (error: any) {
            console.error('Failed to create content:', error);
            alert('Failed to create content. Please try again.');
        }
    };

    const handleUpdateContent = async () => {
    try {
        if (!selectedContent || !courseId) return;

        let endpoint = '';
        let requestData: any;

        const contentType = selectedContent.content_type_name || selectedContent.content_type;

        // FIX: Use consistent case comparison
        if (contentType.toLowerCase() === 'pdf') {
            endpoint = `courses/${courseId}/contents/pdf/${selectedContent.id}/`;
            const formData = new FormData();
            formData.append('title', newContentData.title);
            formData.append('caption', newContentData.caption);

            if (newContentData.file) {
                formData.append('pdf_file', newContentData.file);
            }

            requestData = formData;
        } else if (contentType.toLowerCase() === 'qcm') { // Changed to lowercase comparison
            endpoint = `courses/${courseId}/contents/qcm/${selectedContent.id}/`;
            requestData = {
                title: newContentData.title,
                caption: newContentData.caption,
                qcm_question: newContentData.questions[0].question,
                question_type: newContentData.questions[0].question_type,
                qcm_options: newContentData.questions[0].options.map((option: any) => ({
                    text: option.text,
                    is_correct: option.is_correct
                })),
                points: newContentData.points,
                passing_score: newContentData.passing_score,
                max_attempts: newContentData.max_attempts,
                time_limit: newContentData.time_limit
            };
        } else if (contentType.toLowerCase() === 'video') { // Add video support for updates
            endpoint = `courses/${courseId}/contents/video/${selectedContent.id}/`;
            const formData = new FormData();
            formData.append('title', newContentData.title);
            formData.append('caption', newContentData.caption);

            if (newContentData.file) {
                formData.append('video_file', newContentData.file);
            }

            requestData = formData;
        }

        // FIX: Add proper error handling for unsupported content types
        if (!endpoint) {
            alert(`Update not supported for content type: ${contentType}`);
            return;
        }

        let response;
        if (contentType.toLowerCase() === 'qcm') {
            response = await api.put(endpoint, requestData, {
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            response = await api.put(endpoint, requestData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        }

        alert('Content updated successfully!');
        await fetchModules();

        setShowNewContentModal(false);
        setEditMode(false);
        setSelectedContent(null);
        setNewContentData({
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
            time_limit: 0
        });

    } catch (error: any) { // Added error type for better debugging
        console.error('Failed to update content:', error);
        console.error('Error details:', error.response?.data);
        alert(`Failed to update content: ${error.response?.data?.message || error.message}`);
    }
};

    const handleContentClick = (content: CourseContent) => {
        setViewContentModal(content);
    };

    const handleEditContent = (content: CourseContent) => {
    setSelectedContent(content);
    const contentType = content.content_type_name || content.content_type;
    
    // FIX: Normalize content type to match your state
    const normalizedType = contentType.toLowerCase() === 'qcm' ? 'QCM' : 
                          contentType.toLowerCase() === 'pdf' ? 'pdf' : 
                          contentType.toLowerCase() === 'video' ? 'Video' : null;
    
    setNewContentData({
        title: content.title,
        caption: content.caption || '',
        file: null,
        questions: content.qcm ? [{
            question: content.qcm.question,
            question_type: content.qcm.question_type || 'single',
            options: content.qcm.options
        }] : [{
            question: '',
            question_type: 'single',
            options: [
                { text: '', is_correct: false },
                { text: '', is_correct: false }
            ]
        }],
        points: content.qcm?.points || 1,
        passing_score: content.qcm?.passing_score || 80,
        max_attempts: content.qcm?.max_attempts || 3,
        time_limit: content.qcm?.time_limit || 0
    });
    setShowNewContentModal(true);
    setEditMode(true);
    setSelectedContentType(normalizedType as 'pdf' | 'Video' | 'QCM');
};

    const handleViewContentEdit = () => {
        if (viewContentModal) {
            handleEditContent(viewContentModal);
            setViewContentModal(null);
        }
    };

    const handleModuleClick = (module: Module) => {
        setSelectedModuleForEdit(module);
        setNewModuleData({
            title: module.title,
            description: module.description || ''
        });
        setShowNewModuleModal(true);
        setModuleEditMode(true);
    };

    const handleDeleteContent = async (contentId: number, moduleId: number) => {
        if (!window.confirm('Are you sure you want to delete this content?')) {
            return;
        }

        try {
            await api.delete(`courses/${courseId}/contents/${contentId}/`);

            setModules(modules.map(module => {
                if (module.id === moduleId) {
                    return {
                        ...module,
                        contents: module.contents?.filter(content => content.id !== contentId) || []
                    };
                }
                return module;
            }));

            setShowNewContentModal(false);
        } catch (error) {
            console.error('Failed to delete content:', error);
            alert('Failed to delete content');
        }
    };

    const toggleModuleExpansion = (moduleId: number) => {
        setExpandedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const addQuestion = () => {
        setNewContentData(prev => ({
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

    const addOption = (questionIndex: number) => {
        setNewContentData(prev => ({
            ...prev,
            questions: prev.questions.map((q, idx) =>
                idx === questionIndex
                    ? { ...q, options: [...q.options, { text: '', is_correct: false }] }
                    : q
            )
        }));
    };

    const removeQuestion = (questionIndex: number) => {
        setNewContentData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, idx) => idx !== questionIndex)
        }));
    };

    const removeOption = (questionIndex: number, optionIndex: number) => {
        setNewContentData(prev => ({
            ...prev,
            questions: prev.questions.map((q, idx) =>
                idx === questionIndex
                    ? { ...q, options: q.options.filter((_, oIdx) => oIdx !== optionIndex) }
                    : q
            )
        }));
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = '/group.avif';
    };

    const handleTakeQuiz = (content: CourseContent) => {
        setSelectedQuizContent(content);
    };

    const handleQuizComplete = async (score: number, passed: boolean) => {
        if (!selectedQuizContent || !courseId) return;

        try {
            const response = await api.post(`courses/${courseId}/contents/qcm/${selectedQuizContent.id}/attempt/`, {
                score: score,
                passed: passed,
                completed_at: new Date().toISOString()
            });

            alert(`Quiz completed! Score: ${score} - ${passed ? 'Passed' : 'Failed'}`);
            setSelectedQuizContent(null);
            await fetchModules();
        } catch (error) {
            console.error('Failed to submit quiz results:', error);
            alert('Failed to submit quiz results');
        }
    };

    const overallCourseStats = modules.reduce((acc: CourseStats, module) => {
        if (module.content_stats) {
            if (acc.total_users_enrolled === 0) {
                acc.total_users_enrolled = module.content_stats.total_users_enrolled;
                acc.total_users_completed = module.content_stats.total_users_completed;
                acc.total_courses_completed = module.content_stats.total_courses_completed;
                acc.total_modules = module.content_stats.total_modules;
                acc.completion_rate = module.content_stats.completion_rate;
                acc.average_progress = module.content_stats.average_progress;
                acc.total_contents_course = module.content_stats.total_contents_course;
            }
            
            acc.total_contents_module += module.content_stats.total_contents_module;
            acc.pdf_count += module.content_stats.pdf_count;
            acc.video_count += module.content_stats.video_count;
            acc.qcm_count += module.content_stats.qcm_count;
        }
        return acc;
    }, {
        total_users_enrolled: 0,
        total_users_completed: 0,
        total_courses_completed: 0,
        total_modules: 0,
        total_contents_course: 0,
        completion_rate: 0,
        average_progress: 0,
        total_contents_module: 0,
        pdf_count: 0,
        video_count: 0,
        qcm_count: 0
    });

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
                <button className="btn btn-primary" onClick={onClose}>
                    Go Back
                </button>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="container mt-4">
                <div className="alert alert-warning" role="alert">
                    Course not found
                </div>
                <button className="btn btn-primary" onClick={onClose}>
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="container-fluid mt-4">
            <div className="row">
                <div className="col-12">
                    <div className="card mb-4">
                        <div className="card-header bg-white">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h1 className="h3 mb-0">{course.title_of_course}</h1>
                                    <p className="text-muted mb-0">{course.description}</p>
                                </div>
                                <div>
                                    <button className="btn btn-primary me-2" onClick={() => onEditCourse(course.id)}>
                                        <i className="fas fa-edit me-1"></i> Edit Course
                                    </button>
                                    <button className="btn btn-success me-2" onClick={() => setShowNewModuleModal(true)}>
                                        <i className="fas fa-folder-plus me-1"></i> Add Module
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-xl-3 col-lg-4">
                    <div className="card mb-4">
                        <img
                            src={getImageUrl(course.image)}
                            alt={course.title_of_course}
                            onError={handleImageError}
                            className="card-img-top"
                            style={{ height: '200px', objectFit: 'cover' }}
                        />
                        <div className="card-body">
                            <h5 className="card-title">Course Overview</h5>
                            <div className="mb-3">
                                <strong>Created by:</strong><br />
                                {course.creator_first_name} {course.creator_last_name}
                            </div>
                            <div className="mb-3">
                                <strong>Created on:</strong><br />
                                {new Date(course.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-body">
                            <CircularStatsDisplay stats={overallCourseStats} type="course" />
                        </div>
                    </div>
                </div>

                <div className="col-xl-9 col-lg-8">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">
                                <i className="fas fa-book me-2"></i>
                                Course Content
                            </h5>
                        </div>
                        <div className="card-body">
                            {modules.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="fas fa-book-open fa-3x text-muted mb-3"></i>
                                    <h5 className="text-muted">No modules available yet</h5>
                                    <button 
                                        className="btn btn-primary btn-lg"
                                        onClick={() => setShowNewModuleModal(true)}
                                    >
                                        Create First Module
                                    </button>
                                </div>
                            ) : (
                                <div className="accordion" id="modulesAccordion">
                                    {modules.sort((a, b) => a.order - b.order).map((module, moduleIndex) => {
                                        const isExpanded = expandedModules.includes(module.id);
                                        const moduleContents = module.contents || [];

                                        return (
                                            <div key={module.id} className="accordion-item border-0 mb-3">
                                                <div className="accordion-header">
                                                    <div className="card">
                                                        <div className="card-header bg-light d-flex align-items-center">
                                                            <button
                                                                className="btn btn-link text-decoration-none text-dark flex-grow-1 text-start"
                                                                onClick={() => toggleModuleExpansion(module.id)}
                                                            >
                                                                <div className="d-flex align-items-center">
                                                                    <i className="fas fa-folder-open me-3 text-primary fs-4"></i>
                                                                    <div>
                                                                        <h6 className="mb-1">Module {moduleIndex + 1}: {module.title}</h6>
                                                                        {module.description && (
                                                                            <small className="text-muted">{module.description}</small>
                                                                        )}
                                                                        {module.content_stats && (
                                                                            <CircularStatsDisplay stats={module.content_stats} type="module" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                            <div className="btn-group ms-3">
                                                                <button className="btn btn-sm btn-outline-secondary" onClick={() => handleModuleClick(module)}>
                                                                    <i className="fas fa-edit"></i>
                                                                </button>
                                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteModule(module.id)}>
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                                <button className="btn btn-sm btn-success" onClick={() => {
                                                                    setSelectedModule(module.id);
                                                                    setShowNewContentModal(true);
                                                                }}>
                                                                    <i className="fas fa-plus"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        
                                                        {isExpanded && (
                                                            <div className="card-body">
                                                                {moduleContents.length === 0 ? (
                                                                    <div className="text-center py-4">
                                                                        <p className="text-muted">No content in this module yet.</p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="row">
                                                                        {moduleContents.sort((a, b) => a.order - b.order).map((content) => (
                                                                            <div key={content.id} className="col-md-6 mb-3">
                                                                                <div 
                                                                                    className="card h-100 cursor-pointer"
                                                                                    style={{ cursor: 'pointer' }}
                                                                                    onClick={() => handleContentClick(content)}
                                                                                >
                                                                                    <div className="card-body">
                                                                                        <div className="d-flex align-items-start">
                                                                                            <i className={`${getContentIcon(content.content_type_name || content.content_type)} me-3 fs-3 mt-1`}></i>
                                                                                            <div className="flex-grow-1">
                                                                                                <h6 className="card-title mb-1">{content.title}</h6>
                                                                                                {content.caption && (
                                                                                                    <p className="card-text text-muted small mb-2">{content.caption}</p>
                                                                                                )}
                                                                                                <div className="d-flex justify-content-between align-items-center">
                                                                                                    <small className="text-muted">
                                                                                                        {content.content_type_name || content.content_type} • Order: {content.order}
                                                                                                    </small>
                                                                                                    <div onClick={(e) => e.stopPropagation()}>
                                                                                                        {content.content_type_name === 'qcm' && (
                                                                                                            <button
                                                                                                                className="btn btn-sm btn-warning me-1"
                                                                                                                onClick={() => handleTakeQuiz(content)}
                                                                                                                title="Take Quiz"
                                                                                                            >
                                                                                                                <i className="fas fa-play"></i>
                                                                                                            </button>
                                                                                                        )}
                                                                                                        <button
                                                                                                            className="btn btn-sm btn-outline-primary me-1"
                                                                                                            onClick={() => handleEditContent(content)}
                                                                                                            title="Edit Content"
                                                                                                        >
                                                                                                            <i className="fas fa-edit"></i>
                                                                                                        </button>
                                                                                                        <button
                                                                                                            className="btn btn-sm btn-outline-danger"
                                                                                                            onClick={() => handleDeleteContent(content.id, module.id)}
                                                                                                            title="Delete Content"
                                                                                                        >
                                                                                                            <i className="fas fa-trash"></i>
                                                                                                        </button>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* View Content Modal */}
            {viewContentModal && (
                <>
                    <ViewContentModal 
                        content={viewContentModal}
                        onClose={() => setViewContentModal(null)}
                        onEdit={handleViewContentEdit}
                    />
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {/* Quiz Modal */}
            {selectedQuizContent && (
                <>
                    <QuizComponent 
                        content={selectedQuizContent} 
                        onClose={() => setSelectedQuizContent(null)}
                        onComplete={handleQuizComplete}
                    />
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {/* New Module Modal */}
            {showNewModuleModal && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{moduleEditMode ? 'Edit Module' : 'Add New Module'}</h5>
                                    <button type="button" className="btn-close" onClick={() => {
                                        setShowNewModuleModal(false);
                                        setModuleEditMode(false);
                                        setSelectedModuleForEdit(null);
                                        setNewModuleData({ title: '', description: '' });
                                    }}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Module Title *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newModuleData.title}
                                            onChange={(e) => setNewModuleData({ ...newModuleData, title: e.target.value })}
                                            placeholder="Enter module title"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-control"
                                            value={newModuleData.description}
                                            onChange={(e) => setNewModuleData({ ...newModuleData, description: e.target.value })}
                                            placeholder="Enter module description"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => {
                                        setShowNewModuleModal(false);
                                        setModuleEditMode(false);
                                        setSelectedModuleForEdit(null);
                                        setNewModuleData({ title: '', description: '' });
                                    }}>
                                        Cancel
                                    </button>
                                    <button type="button" className="btn btn-primary" onClick={moduleEditMode ? handleUpdateModule : handleCreateModule} disabled={!newModuleData.title}>
                                        {moduleEditMode ? 'Update Module' : 'Create Module'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {/* New Content Modal */}
            {showNewContentModal && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{editMode ? 'Edit Content' : 'Add New Content'}</h5>
                                    <button type="button" className="btn-close" onClick={() => {
                                        setShowNewContentModal(false);
                                        setSelectedContentType(null);
                                        setSelectedModule(null);
                                        setEditMode(false);
                                        setNewContentData({
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
                                            time_limit: 0
                                        });
                                    }}></button>
                                </div>
                                <div className="modal-body">
                                    {!selectedContentType ? (
                                        <div className="text-center">
                                            <h6>Choose Content Type</h6>
                                            <div className="d-flex justify-content-center gap-3 mt-3">
                                                <button className="btn btn-outline-primary" onClick={() => setSelectedContentType('pdf')}>
                                                    <i className="fas fa-file-pdf me-2"></i> PDF
                                                </button>
                                                <button className="btn btn-outline-primary" onClick={() => setSelectedContentType('Video')}>
                                                    <i className="fas fa-video me-2"></i> Video
                                                </button>
                                                <button className="btn btn-outline-primary" onClick={() => setSelectedContentType('QCM')}>
                                                    <i className="fas fa-question-circle me-2"></i> QCM Quiz
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="mb-3">
                                                <label className="form-label">Content Title *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={newContentData.title}
                                                    onChange={(e) => setNewContentData({ ...newContentData, title: e.target.value })}
                                                    placeholder="Enter content title"
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Description</label>
                                                <textarea
                                                    className="form-control"
                                                    value={newContentData.caption}
                                                    onChange={(e) => setNewContentData({ ...newContentData, caption: e.target.value })}
                                                    placeholder="Enter content description"
                                                    rows={2}
                                                />
                                            </div>

                                            {selectedContentType === 'pdf' && (
                                                <div className="mb-3">
                                                    <label className="form-label">Upload PDF File *</label>
                                                    <input
                                                        type="file"
                                                        className="form-control"
                                                        accept=".pdf"
                                                        onChange={(e) => setNewContentData({ ...newContentData, file: e.target.files?.[0] || null })}
                                                        required
                                                    />
                                                    <small className="text-muted">Only PDF files are accepted</small>
                                                </div>
                                            )}

                                            {selectedContentType === 'Video' && (
                                                <div className="mb-3">
                                                    <label className="form-label">Upload Video File *</label>
                                                    <input
                                                        type="file"
                                                        className="form-control"
                                                        accept="video/*"
                                                        onChange={(e) => setNewContentData({ ...newContentData, file: e.target.files?.[0] || null })}
                                                        required
                                                    />
                                                    <small className="text-muted">Supported formats: MP4, AVI, MOV</small>
                                                </div>
                                            )}

                                            {selectedContentType === 'QCM' && (
                                                <div>
                                                    <div className="row mb-3">
                                                        <div className="col-md-6">
                                                            <label className="form-label">Question Type *</label>
                                                            <select
                                                                className="form-select"
                                                                value={newContentData.questions[0].question_type}
                                                                onChange={(e) => {
                                                                    const newQuestions = [...newContentData.questions];
                                                                    newQuestions[0].question_type = e.target.value as 'single' | 'multiple';
                                                                    setNewContentData({ ...newContentData, questions: newQuestions });
                                                                }}
                                                            >
                                                                <option value="single">Single Choice</option>
                                                                <option value="multiple">Multiple Choice</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <label className="form-label">Points</label>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                value={newContentData.points}
                                                                onChange={(e) => setNewContentData({ ...newContentData, points: parseInt(e.target.value) })}
                                                                min="1"
                                                            />
                                                        </div>
                                                        <div className="col-md-3">
                                                            <label className="form-label">Passing Score (%)</label>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                value={newContentData.passing_score}
                                                                onChange={(e) => setNewContentData({ ...newContentData, passing_score: parseInt(e.target.value) })}
                                                                min="0"
                                                                max="100"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="row mb-3">
                                                        <div className="col-md-6">
                                                            <label className="form-label">Max Attempts</label>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                value={newContentData.max_attempts}
                                                                onChange={(e) => setNewContentData({ ...newContentData, max_attempts: parseInt(e.target.value) })}
                                                                min="1"
                                                            />
                                                        </div>
                                                        <div className="col-md-6">
                                                            <label className="form-label">Time Limit (min)</label>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                value={newContentData.time_limit}
                                                                onChange={(e) => setNewContentData({ ...newContentData, time_limit: parseInt(e.target.value) })}
                                                                min="0"
                                                            />
                                                        </div>
                                                    </div>

                                                    {newContentData.questions.map((question, qIndex) => (
                                                        <div key={qIndex} className="card mb-3">
                                                            <div className="card-header d-flex justify-content-between align-items-center">
                                                                <h6 className="mb-0">Question {qIndex + 1}</h6>
                                                                {newContentData.questions.length > 1 && (
                                                                    <button type="button" className="btn btn-sm btn-danger" onClick={() => removeQuestion(qIndex)}>
                                                                        <i className="fas fa-trash"></i>
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="mb-3">
                                                                    <label className="form-label">Question Text *</label>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control"
                                                                        value={question.question}
                                                                        onChange={(e) => {
                                                                            const newQuestions = [...newContentData.questions];
                                                                            newQuestions[qIndex].question = e.target.value;
                                                                            setNewContentData({ ...newContentData, questions: newQuestions });
                                                                        }}
                                                                        placeholder="Enter question"
                                                                        required
                                                                    />
                                                                </div>

                                                                <div className="mb-3">
                                                                    <label className="form-label">Options *</label>
                                                                    {question.options.map((option, oIndex) => (
                                                                        <div key={oIndex} className="input-group mb-2">
                                                                            <input
                                                                                type="text"
                                                                                className="form-control"
                                                                                value={option.text}
                                                                                onChange={(e) => {
                                                                                    const newQuestions = [...newContentData.questions];
                                                                                    newQuestions[qIndex].options[oIndex].text = e.target.value;
                                                                                    setNewContentData({ ...newContentData, questions: newQuestions });
                                                                                }}
                                                                                placeholder="Option text"
                                                                                required
                                                                            />
                                                                            <div className="input-group-text">
                                                                                <input
                                                                                    type={question.question_type === 'single' ? 'radio' : 'checkbox'}
                                                                                    name={`question-${qIndex}`}
                                                                                    checked={option.is_correct}
                                                                                    onChange={(e) => {
                                                                                        const newQuestions = [...newContentData.questions];
                                                                                        
                                                                                        if (question.question_type === 'single') {
                                                                                            newQuestions[qIndex].options.forEach((opt, idx) => {
                                                                                                opt.is_correct = idx === oIndex;
                                                                                            });
                                                                                        } else {
                                                                                            newQuestions[qIndex].options[oIndex].is_correct = e.target.checked;
                                                                                        }
                                                                                        
                                                                                        setNewContentData({ ...newContentData, questions: newQuestions });
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            {question.options.length > 2 && (
                                                                                <button type="button" className="btn btn-outline-danger" onClick={() => removeOption(qIndex, oIndex)}>
                                                                                    <i className="fas fa-times"></i>
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    <button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={() => addOption(qIndex)}>
                                                                        + Add Option
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button type="button" className="btn btn-sm btn-primary mb-3" onClick={addQuestion}>
                                                        + Add Another Question
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => {
                                        if (selectedContentType) {
                                            setSelectedContentType(null);
                                        } else {
                                            setShowNewContentModal(false);
                                            setSelectedModule(null);
                                        }
                                    }}>
                                        {selectedContentType ? 'Back' : 'Cancel'}
                                    </button>
                                    {selectedContentType && (
                                        <button type="button" className="btn btn-primary" onClick={editMode ? handleUpdateContent : handleCreateContent} disabled={
                                            !newContentData.title ||
                                            (selectedContentType === 'pdf' && !newContentData.file && !editMode) ||
                                            (selectedContentType === 'Video' && !newContentData.file && !editMode) ||
                                            (selectedContentType === 'QCM' && (
                                                !newContentData.questions[0]?.question ||
                                                newContentData.questions[0]?.options.length < 2 ||
                                                newContentData.questions[0]?.options.filter((opt: any) => opt.is_correct).length === 0
                                            ))
                                        }>
                                            {editMode ? 'Update Content' : 'Create Content'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            <style>{`
                .rotate-270 {
                    transform: rotate(-90deg);
                }
                .transition-all {
                    transition: all 0.3s ease;
                }
                .cursor-pointer {
                    cursor: pointer;
                }
                .cursor-pointer:hover {
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
                    transition: box-shadow 0.15s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default CourseDetail;