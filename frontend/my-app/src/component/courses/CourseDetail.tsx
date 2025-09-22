import React, { useEffect, useState } from 'react';
import api from '../../api/api';

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
    content_stats?: ContentStats;
}

interface CourseContent {
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
    qcm?: {
        id: number;
        question: string;
        options: QCMOption[];
        points: number;
        passing_score: number;
        max_attempts: number;
        time_limit: number;
    };
    created_at: string;
    updated_at: string;
    is_completed?: boolean;
    can_access?: boolean;
}

interface QCMOption {
    id: number;
    text: string;
    is_correct: boolean;
}

interface ContentStats {
    total_users_enrolled: number;
    total_users_completed: number;
    total_courses_completed: number;
    total_modules: number;
    total_contents: number;
    completion_rate: number;
    average_progress: number;
    pdf_count: number;
    video_count: number;
    qcm_count: number;
}

// Add new interface for overall course stats
interface CourseStats {
    total_users_enrolled: number;
    total_users_completed: number;
    total_courses_completed: number;
    total_modules: number;
    total_contents: number;
    completion_rate: number;
    average_progress: number;
    pdf_count: number;
    video_count: number;
    qcm_count: number;
}

const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '/group.avif';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    if (imageUrl.startsWith('/media/')) return `http://localhost:8000${imageUrl}`;
    return `http://localhost:8000/media/${imageUrl}`;
};

const getFileUrl = (fileUrl: string) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
    if (fileUrl.startsWith('/media/')) return `http://localhost:8000${fileUrl}`;
    return `http://localhost:8000/media/${fileUrl}`;
};

const CourseDetail: React.FC<CourseDetailProps> = ({ courseId, onClose, onEditCourse }) => {
    const [course, setCourse] = useState<CourseDetailData | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showNewContentModal, setShowNewContentModal] = useState(false);
    const [showNewModuleModal, setShowNewModuleModal] = useState(false);
    const [selectedContentType, setSelectedContentType] = useState<'pdf' | 'video' | 'qcm' | null>(null);
    const [selectedModule, setSelectedModule] = useState<number | null>(null);

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
    const [showContentModal, setShowContentModal] = useState(false);
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [moduleEditMode, setModuleEditMode] = useState(false);
    const [expandedModules, setExpandedModules] = useState<number[]>([]);

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

                // Calculate overall content stats
                const totalContentStats = modulesResponse.data.reduce((acc: ContentStats, module: Module) => {
                    if (module.content_stats) {
                        acc.total_contents += module.content_stats.total_contents;
                        acc.pdf_count += module.content_stats.pdf_count;
                        acc.video_count += module.content_stats.video_count;
                        acc.qcm_count += module.content_stats.qcm_count;
                    }
                    return acc;
                }, { total_contents: 0, pdf_count: 0, video_count: 0, qcm_count: 0 });

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
            setShowModuleModal(false);
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
                formData.append('order', '1'); // Will be set by backend
                formData.append('module', selectedModule.toString());

                if (newContentData.file) {
                    formData.append('pdf_file', newContentData.file);
                } else {
                    alert('❌ Please select a PDF file');
                    return;
                }

                requestData = formData;
            } else if (selectedContentType === 'video') {
                endpoint = `courses/${courseId}/modules/${selectedModule}/contents/video/`;
                const formData = new FormData();
                formData.append('title', newContentData.title);
                formData.append('caption', newContentData.caption);
                formData.append('order', '1'); // Will be set by backend
                formData.append('module', selectedModule.toString());

                if (newContentData.file) {
                    formData.append('video_file', newContentData.file);
                } else {
                    alert('❌ Please select a video file');
                    return;
                }

                requestData = formData;
            } else if (selectedContentType === 'qcm') {
                endpoint = `courses/${courseId}/modules/${selectedModule}/contents/qcm/`;
                requestData = {
                    title: newContentData.title,
                    caption: newContentData.caption,
                    order: 1, // Will be set by backend
                    module: selectedModule,
                    qcm_question: newContentData.questions[0].question, // Changed from 'question' to 'qcm_question'
                    qcm_options: newContentData.questions[0].options.map((option: any) => ({
                        text: option.text,
                        is_correct: option.is_correct
                    })), // Changed from 'options' to 'qcm_options'
                    points: newContentData.points,
                    passing_score: newContentData.passing_score,
                    max_attempts: newContentData.max_attempts,
                    time_limit: newContentData.time_limit
                };
            }

            let response;
            if (selectedContentType === 'qcm') {
                response = await api.post(endpoint, requestData, {
                    headers: { 'Content-Type': 'application/json' },
                });
            } else {
                response = await api.post(endpoint, requestData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            alert(`✅ ${selectedContentType?.toUpperCase()} content created successfully!`);
            await fetchModules(); // Refresh modules to get updated contents

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

            if (selectedContent.content_type === 'pdf' || selectedContent.content_type_name === 'pdf') {
                endpoint = `courses/${courseId}/contents/pdf/${selectedContent.id}/`;
                const formData = new FormData();
                formData.append('title', newContentData.title);
                formData.append('caption', newContentData.caption);

                if (newContentData.file) {
                    formData.append('pdf_file', newContentData.file);
                }

                requestData = formData;
            } else if (selectedContent.content_type === 'qcm' || selectedContent.content_type_name === 'qcm') {
                endpoint = `courses/${courseId}/contents/qcm/${selectedContent.id}/`;
                requestData = {
                    title: newContentData.title,
                    caption: newContentData.caption,
                    qcm_question: newContentData.questions[0].question, // Changed from 'question' to 'qcm_question'
                    qcm_options: newContentData.questions[0].options.map((option: any) => ({
                        text: option.text,
                        is_correct: option.is_correct
                    })), // Changed from 'options' to 'qcm_options'
                    points: newContentData.points,
                    passing_score: newContentData.passing_score,
                    max_attempts: newContentData.max_attempts,
                    time_limit: newContentData.time_limit
                };
            }
            let response;
            if (selectedContent.content_type === 'qcm' || selectedContent.content_type_name === 'qcm') {
                response = await api.put(endpoint, requestData, {
                    headers: { 'Content-Type': 'application/json' },
                });
            } else {
                response = await api.put(endpoint, requestData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            alert('Content updated successfully!');
            await fetchModules(); // Refresh modules to get updated contents

            setShowContentModal(false);
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

        } catch (error) {
            console.error('Failed to update content:', error);
            alert('Failed to update content. Please try again.');
        }
    };

    const handleContentClick = (content: CourseContent) => {
        setSelectedContent(content);
        setNewContentData({
            title: content.title,
            caption: content.caption || '',
            file: null,
            questions: content.qcm ? [{
                question: content.qcm.question,
                question_type: 'single',
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
        setShowContentModal(true);
        setEditMode(true);
    };

    const handleModuleClick = (module: Module) => {
        setSelectedModuleForEdit(module);
        setNewModuleData({
            title: module.title,
            description: module.description || ''
        });
        setShowModuleModal(true);
        setModuleEditMode(true);
    };

    const handleDeleteContent = async (contentId: number, moduleId: number) => {
        if (!window.confirm('Are you sure you want to delete this content?')) {
            return;
        }

        try {
            await api.delete(`courses/${courseId}/contents/${contentId}/`);

            // Update the modules state to remove the deleted content
            setModules(modules.map(module => {
                if (module.id === moduleId) {
                    return {
                        ...module,
                        contents: module.contents?.filter(content => content.id !== contentId) || []
                    };
                }
                return module;
            }));

            setShowContentModal(false);
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

    const ContentStatsDisplay: React.FC<{ stats: ContentStats }> = ({ stats }) => (
        <div className="mt-3 p-3 bg-light rounded">
            <h6 className="mb-2">Content Statistics</h6>
            <div className="row text-center mb-3">
                <div className="col-4">
                    <div className="bg-primary text-white p-2 rounded">
                        <h5 className="mb-0">{stats.total_contents}</h5>
                        <small>Total Contents</small>
                    </div>
                </div>
                <div className="col-4">
                    <div className="bg-info text-white p-2 rounded">
                        <h5 className="mb-0">{stats.total_modules}</h5>
                        <small>Total Modules</small>
                    </div>
                </div>
                <div className="col-4">
                    <div className="bg-secondary text-white p-2 rounded">
                        <h5 className="mb-0">{stats.total_users_enrolled}</h5>
                        <small>Enrolled Users</small>
                    </div>
                </div>
            </div>
            <div className="row text-center mb-3">
                <div className="col-4">
                    <div className="bg-success text-white p-2 rounded">
                        <h5 className="mb-0">{stats.completion_rate}%</h5>
                        <small>Completion Rate</small>
                    </div>
                </div>
                <div className="col-4">
                    <div className="bg-warning text-dark p-2 rounded">
                        <h5 className="mb-0">{stats.average_progress}%</h5>
                        <small>Avg Progress</small>
                    </div>
                </div>
                <div className="col-4">
                    <div className="bg-dark text-white p-2 rounded">
                        <h5 className="mb-0">{stats.total_users_completed}</h5>
                        <small>Completed Users</small>
                    </div>
                </div>
            </div>
            <div className="row text-center">
                <div className="col-4">
                    <div className="bg-danger text-white p-2 rounded">
                        <h5 className="mb-0">{stats.pdf_count}</h5>
                        <small>PDFs</small>
                    </div>
                </div>
                <div className="col-4">
                    <div className="bg-success text-white p-2 rounded">
                        <h5 className="mb-0">{stats.video_count}</h5>
                        <small>Videos</small>
                    </div>
                </div>
                <div className="col-4">
                    <div className="bg-warning text-dark p-2 rounded">
                        <h5 className="mb-0">{stats.qcm_count}</h5>
                        <small>QCMs</small>
                    </div>
                </div>
            </div>
        </div>
    );

    const getContentIcon = (contentType: string) => {
        switch (contentType) {
            case 'pdf':
                return 'fas fa-file-pdf text-danger';
            case 'video':
                return 'fas fa-video text-success';
            case 'qcm':
                return 'fas fa-question-circle text-warning';
            default:
                return 'fas fa-file text-secondary';
        }
    };

    // Calculate overall content stats
    // Calculate overall course stats from all modules
    const overallCourseStats = modules.reduce((acc: CourseStats, module) => {
        if (module.content_stats) {
            // For these stats, we want the course-level totals (they should be the same across modules)
            acc.total_users_enrolled = module.content_stats.total_users_enrolled;
            acc.total_users_completed = module.content_stats.total_users_completed;
            acc.total_courses_completed = module.content_stats.total_courses_completed;
            acc.total_modules = module.content_stats.total_modules;
            acc.completion_rate = module.content_stats.completion_rate;
            acc.average_progress = module.content_stats.average_progress;

            // For content counts, sum across all modules
            acc.total_contents += module.content_stats.total_contents;
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
        total_contents: 0,
        completion_rate: 0,
        average_progress: 0,
        pdf_count: 0,
        video_count: 0,
        qcm_count: 0
    });

    // Use the first module's course-level stats (they should be identical across modules)
    const courseLevelStats = modules.length > 0 && modules[0].content_stats
        ? {
            total_users_enrolled: modules[0].content_stats.total_users_enrolled,
            total_users_completed: modules[0].content_stats.total_users_completed,
            total_courses_completed: modules[0].content_stats.total_courses_completed,
            total_modules: modules[0].content_stats.total_modules,
            completion_rate: modules[0].content_stats.completion_rate,
            average_progress: modules[0].content_stats.average_progress,
            total_contents: overallCourseStats.total_contents,
            pdf_count: overallCourseStats.pdf_count,
            video_count: overallCourseStats.video_count,
            qcm_count: overallCourseStats.qcm_count,
        }
        : overallCourseStats;

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
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>{course.title_of_course}</h1>
                <div>
                    <button className="btn btn-primary me-2" onClick={() => onEditCourse(course.id)}>
                        <i className="fas fa-edit me-1"></i> Edit Course
                    </button>
                    <button className="btn btn-success me-2" onClick={() => setShowNewModuleModal(true)}>
                        <i className="fas fa-folder-plus me-1"></i> Add Module
                    </button>
                    {/* <button className="btn btn-secondary" onClick={onClose}>
                        <i className="fas fa-arrow-left me-1"></i> Back
                    </button> */}
                </div>
            </div>

            <div className="row">
                <div className="col-md-4">
                    <div className="col-md-20">
                        <div className="card mb-6">
                            <img
                                src={getImageUrl(course.image)}
                                alt={course.title_of_course}
                                onError={handleImageError}
                                className="card-img-top"
                                style={{ height: '200px', objectFit: 'cover' }}
                            />
                            <div className="card-body">
                                <h5 className="card-title">Course Details</h5>
                                <p className="card-text">{course.description}</p>
                                <p><strong>Created by:</strong> {course.creator_first_name} {course.creator_last_name}</p>
                                <p><strong>Created on:</strong> {new Date(course.created_at).toLocaleDateString()}</p>

                                <ContentStatsDisplay stats={courseLevelStats} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Course Content</h5>
                        </div>
                        <div className="card-body">
                            {modules.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-muted">No modules available yet.</p>
                                    <button className="btn btn-primary" onClick={() => setShowNewModuleModal(true)}>
                                        Create Your First Module
                                    </button>
                                </div>
                            ) : (
                                <div className="accordion" id="modulesAccordion">
                                    {modules.sort((a, b) => a.order - b.order).map((module, moduleIndex) => {
                                        const isExpanded = expandedModules.includes(module.id);
                                        const moduleContents = module.contents || [];

                                        return (
                                            <div key={module.id} className="accordion-item">
                                                <div className="accordion-header d-flex align-items-center p-3">
                                                    <button
                                                        className="accordion-button flex-grow-1 text-start"
                                                        onClick={() => toggleModuleExpansion(module.id)}
                                                        style={{
                                                            border: 'none',
                                                            background: 'transparent',
                                                            boxShadow: 'none'
                                                        }}
                                                    >
                                                        <span>
                                                            <strong>Module {moduleIndex + 1}: {module.title}</strong>
                                                            {module.description && (
                                                                <small className="text-muted d-block">{module.description}</small>
                                                            )}
                                                            <small className="text-muted d-block mt-1">
                                                                {module.content_stats?.total_contents || 0} content items
                                                                {module.content_stats && (
                                                                    <span className="ms-2">
                                                                        ({module.content_stats.pdf_count} PDFs, {module.content_stats.video_count} Videos, {module.content_stats.qcm_count} QCMs)
                                                                    </span>
                                                                )}
                                                            </small>
                                                        </span>
                                                    </button>

                                                    <div className="accordion-actions ms-3">
                                                        <button
                                                            className="btn btn-sm btn-outline-secondary me-1"
                                                            onClick={() => handleModuleClick(module)}
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger me-1"
                                                            onClick={() => handleDeleteModule(module.id)}
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => {
                                                                setSelectedModule(module.id);
                                                                setShowNewContentModal(true);
                                                            }}
                                                        >
                                                            <i className="fas fa-plus"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                {isExpanded && (
                                                    <div className="accordion-collapse show">
                                                        <div className="accordion-body">
                                                            {/* Add module-specific stats */}
                                                            {module.content_stats && (
                                                                <div className="mb-3 p-2 bg-light rounded">
                                                                    <small className="text-muted">
                                                                        <strong>Module Stats:</strong> {module.content_stats.total_contents} contents •
                                                                        {module.content_stats.pdf_count} PDFs • {module.content_stats.video_count} Videos • {module.content_stats.qcm_count} QCMs
                                                                    </small>
                                                                </div>
                                                            )}

                                                            {moduleContents.length === 0 ? (
                                                                <p className="text-muted">No content in this module yet.</p>
                                                            ) : (
                                                                <div className="list-group">
                                                                    {moduleContents.sort((a, b) => a.order - b.order).map((content, contentIndex) => (
                                                                        <div key={content.id} className="list-group-item d-flex justify-content-between align-items-center">
                                                                            <div className="d-flex align-items-center">
                                                                                <i className={`${getContentIcon(content.content_type_name || content.content_type)} me-3 fs-5`}></i>
                                                                                <div>
                                                                                    <h6 className="mb-1">{content.title}</h6>
                                                                                    <small className="text-muted">
                                                                                        {content.caption && `${content.caption} • `}
                                                                                        {content.content_type_name || content.content_type} •
                                                                                        Order: {content.order}
                                                                                    </small>
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <button
                                                                                    className="btn btn-sm btn-outline-primary me-1"
                                                                                    onClick={() => handleContentClick(content)}
                                                                                >
                                                                                    <i className="fas fa-edit"></i>
                                                                                </button>
                                                                                <button
                                                                                    className="btn btn-sm btn-outline-danger"
                                                                                    onClick={() => handleDeleteContent(content.id, module.id)}
                                                                                >
                                                                                    <i className="fas fa-trash"></i>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* New Module Modal */}
            {showNewModuleModal && (
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
            )}

            {/* New Content Modal */}
            {showNewContentModal && (
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
                                            <button className="btn btn-outline-primary" onClick={() => setSelectedContentType('video')}>
                                                <i className="fas fa-video me-2"></i> Video
                                            </button>
                                            <button className="btn btn-outline-primary" onClick={() => setSelectedContentType('qcm')}>
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

                                        {selectedContentType === 'video' && (
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

                                        {selectedContentType === 'qcm' && (
                                            <div>
                                                <div className="row mb-3">
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
                                                    <div className="col-md-3">
                                                        <label className="form-label">Max Attempts</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            value={newContentData.max_attempts}
                                                            onChange={(e) => setNewContentData({ ...newContentData, max_attempts: parseInt(e.target.value) })}
                                                            min="1"
                                                        />
                                                    </div>
                                                    <div className="col-md-3">
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
                                                                                type="radio"
                                                                                name={`question-${qIndex}`}
                                                                                checked={option.is_correct}
                                                                                onChange={() => {
                                                                                    const newQuestions = [...newContentData.questions];
                                                                                    newQuestions[qIndex].options.forEach((opt, idx) => {
                                                                                        opt.is_correct = idx === oIndex;
                                                                                    });
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
                                        (selectedContentType === 'video' && !newContentData.file && !editMode) ||
                                        (selectedContentType === 'qcm' && (
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
            )}

            {/* Backdrop for modals */}
            {(showNewContentModal || showNewModuleModal) && <div className="modal-backdrop fade show"></div>}
        </div>
    );
};

export default CourseDetail;