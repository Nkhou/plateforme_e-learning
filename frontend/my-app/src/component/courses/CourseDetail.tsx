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

// Quiz Interfaces
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

interface QuizState {
    currentQuestionIndex: number;
    selectedOptions: number[];
    timeRemaining: number;
    isCompleted: boolean;
    score: number;
    attempts: number;
    showResults: boolean;
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

// Circular Progress Component
interface CircularProgressProps {
    value: number;
    max: number;
    label: string;
    color: string;
    size?: number;
    strokeWidth?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ 
    value, 
    max, 
    label, 
    color, 
    size = 80, 
    strokeWidth = 8 
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = max > 0 ? (value / max) * 100 : 0;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="text-center">
            <div className="position-relative d-inline-block">
                <svg width={size} height={size} className="rotate-270">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#e9ecef"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-300"
                    />
                </svg>
                <div 
                    className="position-absolute top-50 start-50 translate-middle text-center"
                    style={{ width: size - strokeWidth * 2, height: size - strokeWidth * 2 }}
                >
                    <div className="h-100 d-flex flex-column justify-content-center">
                        <strong className="fs-6">{value}</strong>
                        <small className="text-muted">{max > 1000 ? 'k' : ''}</small>
                    </div>
                </div>
            </div>
            <div className="mt-2">
                <small className="text-muted d-block">{label}</small>
            </div>
        </div>
    );
};

// Circular Statistic Display Component
interface CircularStatsDisplayProps {
    stats: ContentStats;
    type: 'course' | 'module';
}

const CircularStatsDisplay: React.FC<CircularStatsDisplayProps> = ({ stats, type }) => {
    const statItems = type === 'course' ? [
        { value: stats.total_contents, max: Math.max(stats.total_contents, 50), label: 'Total Contents', color: '#007bff' },
        { value: stats.total_modules, max: Math.max(stats.total_modules, 10), label: 'Modules', color: '#17a2b8' },
        { value: stats.total_users_enrolled, max: Math.max(stats.total_users_enrolled, 100), label: 'Enrolled', color: '#6c757d' },
        { value: stats.completion_rate, max: 100, label: 'Completion %', color: '#28a745' },
        { value: stats.average_progress, max: 100, label: 'Avg Progress', color: '#ffc107' },
        { value: stats.total_users_completed, max: Math.max(stats.total_users_completed, 50), label: 'Completed', color: '#343a40' }
    ] : [
        { value: stats.total_contents, max: Math.max(stats.total_contents, 20), label: 'Contents', color: '#007bff' },
        { value: stats.pdf_count, max: Math.max(stats.total_contents, 1), label: 'PDFs', color: '#dc3545' },
        { value: stats.video_count, max: Math.max(stats.total_contents, 1), label: 'Videos', color: '#28a745' },
        { value: stats.qcm_count, max: Math.max(stats.total_contents, 1), label: 'QCMs', color: '#ffc107' }
    ];

    return (
        <div className={`stats-container ${type === 'course' ? 'course-stats' : 'module-stats'}`}>
            <h6 className="mb-3">{type === 'course' ? 'Course Statistics' : 'Module Statistics'}</h6>
            <div className="row g-3 justify-content-center">
                {statItems.map((stat, index) => (
                    <div key={index} className="col-4 col-sm-3">
                        <CircularProgress
                            value={stat.value}
                            max={stat.max}
                            label={stat.label}
                            color={stat.color}
                            size={type === 'course' ? 70 : 60}
                            strokeWidth={type === 'course' ? 6 : 5}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

// Quiz Component
interface QuizProps {
    content: CourseContent;
    onClose: () => void;
    onComplete: (score: number, passed: boolean) => void;
}

const QuizComponent: React.FC<QuizProps> = ({ content, onClose, onComplete }) => {
    const [quizState, setQuizState] = useState<QuizState>({
        currentQuestionIndex: 0,
        selectedOptions: [],
        timeRemaining: content.qcm?.time_limit ? content.qcm.time_limit * 60 : 0,
        isCompleted: false,
        score: 0,
        attempts: 0,
        showResults: false
    });

    const [userAnswers, setUserAnswers] = useState<number[][]>([]);
    const [quizStarted, setQuizStarted] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (quizStarted && quizState.timeRemaining > 0 && !quizState.isCompleted) {
            timer = setInterval(() => {
                setQuizState(prev => ({
                    ...prev,
                    timeRemaining: prev.timeRemaining - 1
                }));
            }, 1000);
        } else if (quizState.timeRemaining === 0 && !quizState.isCompleted) {
            handleQuizComplete();
        }
        return () => clearInterval(timer);
    }, [quizState.timeRemaining, quizState.isCompleted, quizStarted]);

    const startQuiz = () => {
        setQuizStarted(true);
        setUserAnswers([]);
    };

    const handleOptionSelect = (optionId: number) => {
        if (content.qcm?.options) {
            const currentOptions = [...quizState.selectedOptions];
            const optionIndex = currentOptions.indexOf(optionId);
            
            if (optionIndex > -1) {
                currentOptions.splice(optionIndex, 1);
            } else {
                currentOptions.push(optionId);
            }
            
            setQuizState(prev => ({ ...prev, selectedOptions: currentOptions }));
        }
    };

    const handleQuizComplete = () => {
        if (content.qcm?.options) {
            const finalAnswers = [...userAnswers, quizState.selectedOptions];
            const correctAnswers = content.qcm.options
                .filter(opt => opt.is_correct)
                .map(opt => opt.id);
            
            const isCorrect = JSON.stringify([...finalAnswers[0]].sort()) === JSON.stringify([...correctAnswers].sort());
            const score = isCorrect ? content.qcm.points : 0;
            const passed = score >= content.qcm.passing_score;

            setQuizState(prev => ({
                ...prev,
                isCompleted: true,
                score,
                showResults: true,
                attempts: prev.attempts + 1
            }));

            onComplete(score, passed);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!content.qcm) return null;

    return (
        <div className="modal fade show d-block">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title">
                            <i className="fas fa-question-circle me-2"></i>
                            {content.title}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    
                    <div className="modal-body">
                        {!quizStarted ? (
                            <div className="text-center py-4">
                                <div className="alert alert-info">
                                    <h6>Quiz Instructions</h6>
                                    <ul className="list-unstyled">
                                        <li>• Points: {content.qcm.points}</li>
                                        <li>• Passing Score: {content.qcm.passing_score}%</li>
                                        <li>• Max Attempts: {content.qcm.max_attempts}</li>
                                        {content.qcm.time_limit > 0 && (
                                            <li>• Time Limit: {content.qcm.time_limit} minutes</li>
                                        )}
                                    </ul>
                                </div>
                                <button className="btn btn-primary btn-lg" onClick={startQuiz}>
                                    Start Quiz
                                </button>
                            </div>
                        ) : quizState.showResults ? (
                            <div className="text-center py-4">
                                <div className={`alert ${quizState.score >= content.qcm.passing_score ? 'alert-success' : 'alert-danger'}`}>
                                    <i className={`fas ${quizState.score >= content.qcm.passing_score ? 'fa-check-circle' : 'fa-times-circle'} fa-3x mb-3`}></i>
                                    <h4>{quizState.score >= content.qcm.passing_score ? 'Congratulations!' : 'Try Again'}</h4>
                                    <p>Your score: {quizState.score}/{content.qcm.points} ({Math.round((quizState.score / content.qcm.points) * 100)}%)</p>
                                    <p>{quizState.score >= content.qcm.passing_score ? 'You passed the quiz!' : `You need ${content.qcm.passing_score}% to pass.`}</p>
                                </div>
                                <button className="btn btn-primary" onClick={onClose}>
                                    Close
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <div>
                                        <span className="badge bg-primary">Question 1 of 1</span>
                                    </div>
                                    {content.qcm.time_limit > 0 && (
                                        <div className="text-end">
                                            <div className={`badge ${quizState.timeRemaining < 60 ? 'bg-danger' : 'bg-warning'}`}>
                                                <i className="fas fa-clock me-1"></i>
                                                {formatTime(quizState.timeRemaining)}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="card mb-4">
                                    <div className="card-body">
                                        <h6 className="card-title">{content.qcm.question}</h6>
                                        <div className="mt-3">
                                            {content.qcm.options.map((option) => (
                                                <div key={option.id} className="form-check mb-3">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={quizState.selectedOptions.includes(option.id)}
                                                        onChange={() => handleOptionSelect(option.id)}
                                                        id={`option-${option.id}`}
                                                    />
                                                    <label className="form-check-label w-100" htmlFor={`option-${option.id}`}>
                                                        {option.text}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-between">
                                    <button 
                                        className="btn btn-secondary" 
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={handleQuizComplete}
                                        disabled={quizState.selectedOptions.length === 0}
                                    >
                                        Submit Answers
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Component
const CourseDetail: React.FC<CourseDetailProps> = ({ courseId, onClose, onEditCourse }) => {
    const [course, setCourse] = useState<CourseDetailData | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showNewContentModal, setShowNewContentModal] = useState(false);
    const [showNewModuleModal, setShowNewModuleModal] = useState(false);
    const [selectedContentType, setSelectedContentType] = useState<'pdf' | 'video' | 'qcm' | null>(null);
    const [selectedModule, setSelectedModule] = useState<number | null>(null);
    const [selectedQuizContent, setSelectedQuizContent] = useState<CourseContent | null>(null);

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

    // ALL THE MISSING FUNCTIONS ADDED BELOW:

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
            } else if (selectedContentType === 'video') {
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
            } else if (selectedContentType === 'qcm') {
                endpoint = `courses/${courseId}/modules/${selectedModule}/contents/qcm/`;
                requestData = {
                    title: newContentData.title,
                    caption: newContentData.caption,
                    order: 1,
                    module: selectedModule,
                    qcm_question: newContentData.questions[0].question,
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
                    qcm_question: newContentData.questions[0].question,
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
        setShowNewContentModal(true);
        setEditMode(true);
        setSelectedContentType((content.content_type_name || content.content_type) as 'pdf' | 'video' | 'qcm');
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
            // Submit quiz results to backend
            const response = await api.post(`courses/${courseId}/contents/qcm/${selectedQuizContent.id}/attempt/`, {
                score: score,
                passed: passed,
                completed_at: new Date().toISOString()
            });

            alert(`Quiz completed! Score: ${score} - ${passed ? 'Passed' : 'Failed'}`);
            setSelectedQuizContent(null);
            
            // Refresh modules to update completion status
            await fetchModules();
        } catch (error) {
            console.error('Failed to submit quiz results:', error);
            alert('Failed to submit quiz results');
        }
    };

    const getContentIcon = (contentType: string) => {
        switch (contentType) {
            case 'pdf': return 'fas fa-file-pdf text-danger';
            case 'video': return 'fas fa-video text-success';
            case 'qcm': return 'fas fa-question-circle text-warning';
            default: return 'fas fa-file text-secondary';
        }
    };

    // Calculate overall course stats
    const overallCourseStats = modules.reduce((acc: CourseStats, module) => {
        if (module.content_stats) {
            acc.total_users_enrolled = module.content_stats.total_users_enrolled;
            acc.total_users_completed = module.content_stats.total_users_completed;
            acc.total_courses_completed = module.content_stats.total_courses_completed;
            acc.total_modules = module.content_stats.total_modules;
            acc.completion_rate = module.content_stats.completion_rate;
            acc.average_progress = module.content_stats.average_progress;
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
            {/* ... (the rest of your JSX remains the same) */}
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
                                    <button className="btn btn-secondary" onClick={onClose}>
                                        <i className="fas fa-arrow-left me-1"></i> Back
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
                                                                                <div className="card h-100">
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
                                                                                                    <div>
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
                                                                                                            onClick={() => handleContentClick(content)}
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
            `}</style>
        </div>
    );
};

export default CourseDetail;