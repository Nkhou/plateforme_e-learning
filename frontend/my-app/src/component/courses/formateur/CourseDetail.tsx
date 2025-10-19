import React, { useEffect, useState } from 'react';
import api from '../../../api/api';
import ViewContentModal from './ViewContentModal'
import CircularStatsDisplay from './CircularStatsDisplay'
import QuizComponent from './QuizComponent'
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

interface CourseDetailProps {
    courseId?: number | null;
    onClose?: () => void;
    // onEditCourse?: (courseId: number) => void;
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
    status: number;
    status_display: string;
    estimated_duration?: number; // Total course duration in minutes
    min_required_time?: number; // Minimum time required to complete (minutes)
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
    status: number;
    status_display: string;
    estimated_duration?: number; // Content duration in minutes
    min_required_time?: number; // Minimum time required for content
    pdf_content?: {
        id: number;
        pdf_file: string;
        page_count?: number;
        estimated_reading_time?: number; // Auto-calculated reading time
    };
    video_content?: {
        id: number;
        video_file: string;
        duration?: number; // Video duration in seconds
    };
    qcm?: QCMData;
    created_at: string;
    updated_at: string;
    is_completed?: boolean;
    can_access?: boolean;
    time_spent?: number; // Actual time spent by user in seconds
    last_accessed?: string;
}

export interface CourseStats {
    total_users_enrolled: number;
    total_users_completed: number;
    // Remove: total_courses_completed: number; // Redundant
    total_modules: number;
    total_contents_course: number;
    completion_rate: number;           // Calculated: (completed/enrolled) * 100
    average_progress: number;
    total_contents_module: number;
    pdf_count: number;
    video_count: number;
    qcm_count: number;
    average_time_spent?: number;
    total_time_tracked?: number;
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

interface Module {
    id: number;
    title: string;
    description: string;
    order: number;
    course: number;
    status: number;
    status_display: string;
    estimated_duration?: number; // Module total duration (auto-calculated)
    min_required_time?: number; // Minimum time required for module
    created_at: string;
    updated_at: string;
    contents?: CourseContent[];
    content_stats?: CourseStats;
}

interface Subscriber {
    id: number;
    user: {
        id: number;
        username: string;
        email: string;
        full_name: string;
        department: string;
        department_display: string;
    };
    subscribed_at: string;
    is_active: boolean;
    progress_percentage: number;
    total_score: number;
    completed_contents_count: number;
    total_contents_count: number;
    is_completed: boolean;
    total_time_spent?: number; // Total time spent on course in seconds
    average_time_per_session?: number; // Average session time
    can_complete_course?: boolean; // Whether user meets time requirements
    completion_requirements?: {
        time_met: boolean;
        required_time: number;
        actual_time: number;
        progress_percentage: number;
    };
}

interface UserProfile {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    privilege: string;
    privilege_display: string;
    department: string;
    department_display: string;
    date_joined: string;
    last_login: string;
    status: number;
    status_display: string;
    course_count: number;
    subscription_count: number;
}

interface ChatMessage {
    id: number;
    sender: number;
    receiver: number;
    message: string;
    timestamp: string;
    is_read: boolean;
    sender_name?: string;
}

// Time Display Component
const TimeDisplay: React.FC<{
    seconds: number;
    type?: 'short' | 'detailed';
    label?: string;
}> = ({ seconds, type = 'short', label }) => {
    const formatTime = (totalSeconds: number) => {
        if (type === 'short') {
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);

            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            }
            return `${minutes}m`;
        } else {
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const secs = totalSeconds % 60;

            if (hours > 0) {
                return `${hours}h ${minutes}m ${secs}s`;
            } else if (minutes > 0) {
                return `${minutes}m ${secs}s`;
            }
            return `${secs}s`;
        }
    };

    return (
        <div className="time-display">
            {label && <small className="text-muted me-2">{label}:</small>}
            <span className="badge bg-info">
                <i className="fas fa-clock me-1"></i>
                {formatTime(seconds)}
            </span>
        </div>
    );
};

// Estimated Time Display Component
// const EstimatedTimeDisplay: React.FC<{
//     estimatedDuration?: number;
//     actualTimeSpent?: number;
//     type: 'module' | 'content';
// }> = ({ estimatedDuration, actualTimeSpent, type }) => {
//     if (!estimatedDuration && !actualTimeSpent) return null;

//     return (
//         <div className="time-info">
//             {estimatedDuration && (
//                 <small className="text-muted me-2">
//                     <i className="fas fa-hourglass-half me-1"></i>
//                     Est: {Math.ceil(estimatedDuration / 60)}min
//                 </small>
//             )}
//             {actualTimeSpent && actualTimeSpent > 0 && (
//                 <small className="text-success">
//                     <i className="fas fa-check-circle me-1"></i>
//                     Spent: <TimeDisplay seconds={actualTimeSpent} type="short" />
//                 </small>
//             )}
//         </div>
//     );
// };

// Time Requirement Badge Component
const TimeRequirementBadge: React.FC<{
    requiredTime: number;
    actualTime: number;
    type: 'course' | 'module' | 'content';
}> = ({ requiredTime, actualTime, type }) => {
    const timeMet = actualTime >= requiredTime;
    const percentage = requiredTime > 0 ? Math.min((actualTime / requiredTime) * 100, 100) : 100;

    return (
        <div className="time-requirement-badge">
            <div className="d-flex align-items-center gap-2">
                {/* <span className={`badge ${timeMet ? 'bg-success' : 'bg-warning'}`}>
                    <i className={`fas ${timeMet ? 'fa-check-circle' : 'fa-clock'} me-1`}></i>
                    {timeMet ? 'Time Met' : 'Time Required'}
                </span>
                <small className="text-muted">
                    {Math.floor(actualTime / 60)}m / {Math.floor(requiredTime / 60)}m
                </small> */}
            </div>
            {/* {!timeMet && (
                <div className="progress mt-1" style={{ height: '4px', width: '80px' }}>
                    <div
                        className="progress-bar bg-warning"
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            )} */}
        </div>
    );
};

// Auto Time Calculator Component
const AutoTimeCalculator: React.FC<{
    contents: CourseContent[];
    onTimeCalculated: (totalTime: number) => void;
}> = ({ contents, onTimeCalculated }) => {
    const calculateTotalTime = () => {
        const totalTime = contents.reduce((sum, content) => {
            return sum + (content.estimated_duration || 0);
        }, 0);
        onTimeCalculated(totalTime);
    };

    return (
        <div className="auto-time-calculator">
            <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={calculateTotalTime}
            >
                <i className="fas fa-calculator me-1"></i>
                Calculate from Contents
            </button>
        </div>
    );
};

const StatusBadge: React.FC<{ status: number; statusDisplay: string }> = ({ status, statusDisplay }) => {
    const getStatusColor = (status: number) => {
        switch (status) {
            case 0: return 'bg-warning text-dark';
            case 1: return 'bg-success text-white';
            case 2: return 'bg-secondary text-white';
            default: return 'bg-light text-dark';
        }
    };

    return (
        <span className={`badge ${getStatusColor(status)}`}>
            {statusDisplay}
        </span>
    );
};

const CourseDetail: React.FC<CourseDetailProps> = ({ courseId, onClose }) => {
    const [course, setCourse] = useState<CourseDetailData | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditCourseModal, setShowEditCourseModal] = useState(false);
    const navigate = useNavigate();

    // Add this function
    const handleEditCourseInternal = () => {
        console.log('hellllllllllllllllllllllllllllllllllllllllllllo')
        // if (course) {
        setShowEditCourseModal(true);
        // }
    };
    const handleBack = () => {
        navigate('/cours');
    }
    const [showNewContentModal, setShowNewContentModal] = useState(false);
    const [showNewModuleModal, setShowNewModuleModal] = useState(false);
    const [selectedContentType, setSelectedContentType] = useState<'pdf' | 'Video' | 'QCM' | null>(null);
    const [selectedModule, setSelectedModule] = useState<number | null>(null);
    const [selectedQuizContent, setSelectedQuizContent] = useState<CourseContent | null>(null);
    const [viewContentModal, setViewContentModal] = useState<CourseContent | null>(null);

    // New state variables
    const [showSubscribersModal, setShowSubscribersModal] = useState(false);
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [showUserProfile, setShowUserProfile] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingSubscribers, setLoadingSubscribers] = useState(false);
    const [loadingChat, setLoadingChat] = useState(false);
    const params = useParams<{ id: string }>();

    // Prefer prop value, fallback to URL param
    const resolvedCourseId = courseId ?? (params.id ? parseInt(params.id, 10) : null);

    if (!resolvedCourseId) {
        return <div>Aucun cours sélectionné</div>;
    }

    if (!resolvedCourseId) return <div>Invalid course ID</div>;

    // Time tracking states
    const [timeTracking, setTimeTracking] = useState<{
        isTracking: boolean;
        startTime: Date | null;
        currentContent: number | null;
        currentModule: number | null;
    }>({
        isTracking: false,
        startTime: null,
        currentContent: null,
        currentModule: null
    });

    const [userTimeStats, setUserTimeStats] = useState<{
        totalCourseTime: number;
        moduleTimes: { [moduleId: number]: number };
        contentTimes: { [contentId: number]: number };
    }>({
        totalCourseTime: 0,
        moduleTimes: {},
        contentTimes: {}
    });

    // New state for time requirements
    const [completionRequirements, setCompletionRequirements] = useState<{
        course: { required: number; actual: number; met: boolean };
        modules: { [moduleId: number]: { required: number; actual: number; met: boolean } };
        contents: { [contentId: number]: { required: number; actual: number; met: boolean } };
    }>({
        course: { required: 0, actual: 0, met: false },
        modules: {},
        contents: {}
    });

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
        time_limit: 0,
        estimated_duration: undefined as number | undefined,
        min_required_time: undefined as number | undefined
    });

    const [newModuleData, setNewModuleData] = useState({
        title: '',
        description: '',
        estimated_duration: undefined as number | undefined,
        min_required_time: undefined as number | undefined
    });

    const [selectedContent, setSelectedContent] = useState<CourseContent | null>(null);
    const [selectedModuleForEdit, setSelectedModuleForEdit] = useState<Module | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [moduleEditMode, setModuleEditMode] = useState(false);
    const [expandedModules, setExpandedModules] = useState<number[]>([]);

    // Helper functions for time estimation
    const getTimeSuggestions = (contentType: string) => {
        switch (contentType) {
            case 'pdf':
                return [
                    { label: '5 min', value: 5 },
                    { label: '10 min', value: 10 },
                    { label: '15 min', value: 15 },
                    { label: '30 min', value: 30 },
                    { label: '45 min', value: 45 }
                ];
            case 'Video':
                return [
                    { label: '5 min', value: 5 },
                    { label: '10 min', value: 10 },
                    { label: '15 min', value: 15 },
                    { label: '20 min', value: 20 },
                    { label: '30 min', value: 30 }
                ];
            case 'QCM':
                return [
                    { label: '5 min', value: 5 },
                    { label: '10 min', value: 10 },
                    { label: '15 min', value: 15 },
                    { label: '20 min', value: 20 },
                    { label: '30 min', value: 30 }
                ];
            default:
                return [
                    { label: '5 min', value: 5 },
                    { label: '10 min', value: 10 },
                    { label: '15 min', value: 15 }
                ];
        }
    };

    // Function to auto-calculate time based on content
    const calculateAutoTime = (contentType: string, data: any): number | undefined => {
        switch (contentType) {
            case 'pdf':
                return undefined;
            case 'Video':
                return undefined;
            case 'QCM':
                const questionCount = data.questions?.length || 1;
                const optionsCount = data.questions?.[0]?.options?.length || 4;
                const baseTime = questionCount * 2; // 2 minutes per question
                const complexityBonus = optionsCount > 4 ? questionCount * 0.5 : 0;
                return Math.ceil(baseTime + complexityBonus);
            default:
                return undefined;
        }
    };

    // Helper function to calculate content estimated time
    const getContentEstimatedTime = (content: CourseContent): number | undefined => {
        const contentType = content.content_type_name || content.content_type;

        if (content.estimated_duration) {
            return content.estimated_duration;
        }

        switch (contentType.toLowerCase()) {
            case 'pdf':
                if (content.pdf_content?.estimated_reading_time) {
                    return content.pdf_content.estimated_reading_time * 60;
                }
                if (content.pdf_content?.page_count) {
                    return content.pdf_content.page_count * 60;
                }
                break;

            case 'video':
                if (content.video_content?.duration) {
                    return content.video_content.duration;
                }
                break;

            case 'qcm':
                if (content.qcm?.time_limit && content.qcm.time_limit > 0) {
                    return content.qcm.time_limit * 60;
                }
                const questionCount = content.qcm ? 1 : 0;
                return questionCount * 30;
        }

        return undefined;
    };

    // Function to format time for display
    const formatTimeForDisplay = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    // Function to calculate total module time from contents
    const calculateModuleTime = (contents: CourseContent[]): number => {
        return contents.reduce((total, content) => {
            return total + (content.estimated_duration || 0);
        }, 0);
    };

    // Function to calculate total course time from modules
    const calculateCourseTime = (modules: Module[]): number => {
        return modules.reduce((total, module) => {
            const moduleTime = module.estimated_duration || calculateModuleTime(module.contents || []);
            return total + moduleTime;
        }, 0);
    };

    // Function to check if user can complete course
    const checkCompletionRequirements = () => {
        if (!course || !modules) return;

        const courseRequiredTime = (course.min_required_time || course.estimated_duration || 0) * 60; // Convert to seconds
        const courseActualTime = userTimeStats.totalCourseTime;

        const modulesRequirements: { [moduleId: number]: { required: number; actual: number; met: boolean } } = {};
        const contentsRequirements: { [contentId: number]: { required: number; actual: number; met: boolean } } = {};

        // Calculate requirements for each module and content
        modules.forEach(module => {
            const moduleRequiredTime = (module.min_required_time || module.estimated_duration || 0) * 60;
            const moduleActualTime = userTimeStats.moduleTimes[module.id] || 0;

            modulesRequirements[module.id] = {
                required: moduleRequiredTime,
                actual: moduleActualTime,
                met: moduleActualTime >= moduleRequiredTime
            };

            // Calculate requirements for each content in the module
            module.contents?.forEach(content => {
                const contentRequiredTime = (content.min_required_time || content.estimated_duration || 0) * 60;
                const contentActualTime = userTimeStats.contentTimes[content.id] || 0;

                contentsRequirements[content.id] = {
                    required: contentRequiredTime,
                    actual: contentActualTime,
                    met: contentActualTime >= contentRequiredTime
                };
            });
        });

        setCompletionRequirements({
            course: {
                required: courseRequiredTime,
                actual: courseActualTime,
                met: courseActualTime >= courseRequiredTime
            },
            modules: modulesRequirements,
            contents: contentsRequirements
        });
    };

    const canCompleteCourse = (): boolean => {
        if (!completionRequirements.course.met) return false;

        // Check if all modules meet time requirements
        const allModulesMet = Object.values(completionRequirements.modules).every(module => module.met);
        if (!allModulesMet) return false;

        return allModulesMet;
    };

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
    // const handleEditCourse = (courseId: number) => {
    //     console.log('Edit course requested:', courseId);
    //     alert(`Edit course with ID: ${courseId}`);
    // };
    const getContentIcon = (contentType: string) => {
        switch (contentType) {
            case 'pdf': return 'fas fa-file-pdf text-danger';
            case 'video': return 'fas fa-video text-success';
            case 'qcm': return 'fas fa-question-circle text-warning';
            default: return 'fas fa-file text-secondary';
        }
    };

    // Time tracking functions - UPDATED WITH FALLBACKS
    const startTimeTracking = (moduleId?: number, contentId?: number) => {
        setTimeTracking({
            isTracking: true,
            startTime: new Date(),
            currentContent: contentId || null,
            currentModule: moduleId || null
        });
    };

    const stopTimeTracking = async () => {
        if (!timeTracking.isTracking || !timeTracking.startTime || !resolvedCourseId) return;

        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - timeTracking.startTime.getTime()) / 1000);

        // Update local state only (no API call)
        setUserTimeStats(prev => {
            const newStats = { ...prev };

            if (timeTracking.currentContent) {
                newStats.contentTimes[timeTracking.currentContent] =
                    (newStats.contentTimes[timeTracking.currentContent] || 0) + duration;
            }

            if (timeTracking.currentModule) {
                newStats.moduleTimes[timeTracking.currentModule] =
                    (newStats.moduleTimes[timeTracking.currentModule] || 0) + duration;
            }

            newStats.totalCourseTime += duration;

            return newStats;
        });

        // Save to localStorage as fallback (no API call)
        try {
            const timeTrackingData = {
                course: resolvedCourseId,
                module: timeTracking.currentModule,
                content: timeTracking.currentContent,
                start_time: timeTracking.startTime.toISOString(),
                end_time: endTime.toISOString(),
                duration: duration,
                session_type: timeTracking.currentContent ? 'content' :
                    timeTracking.currentModule ? 'module' : 'course'
            };

            // Store in localStorage as backup
            const existingData = localStorage.getItem(`timeTracking_${resolvedCourseId}`) || '[]';
            const timeData = JSON.parse(existingData);
            timeData.push(timeTrackingData);
            localStorage.setItem(`timeTracking_${resolvedCourseId}`, JSON.stringify(timeData));

        } catch (error) {
            console.error('Failed to save time tracking locally:', error);
        }

        // Reset tracking
        setTimeTracking({
            isTracking: false,
            startTime: null,
            currentContent: null,
            currentModule: null
        });
    };

    // UPDATED: Fetch time stats from localStorage as fallback
    const fetchTimeStats = async () => {
        if (!resolvedCourseId) return;

        try {
            // Try to fetch from localStorage as fallback
            const timeData = localStorage.getItem(`timeTracking_${resolvedCourseId}`);
            if (timeData) {
                const parsedData = JSON.parse(timeData);
                const stats = {
                    totalCourseTime: 0,
                    moduleTimes: {} as { [moduleId: number]: number },
                    contentTimes: {} as { [contentId: number]: number }
                };

                parsedData.forEach((session: any) => {
                    stats.totalCourseTime += session.duration || 0;

                    if (session.module) {
                        stats.moduleTimes[session.module] = (stats.moduleTimes[session.module] || 0) + (session.duration || 0);
                    }

                    if (session.content) {
                        stats.contentTimes[session.content] = (stats.contentTimes[session.content] || 0) + (session.duration || 0);
                    }
                });

                setUserTimeStats(stats);
            }
        } catch (error) {
            console.error('Failed to fetch time stats from localStorage:', error);
            // Initialize with empty stats
            setUserTimeStats({
                totalCourseTime: 0,
                moduleTimes: {},
                contentTimes: {}
            });
        }
    };

    // Add this debugging code in your CourseDetail component
    useEffect(() => {
        const fetchCourseData = async () => {
            if (!resolvedCourseId) return;

            try {
                setLoading(true);
                const [courseResponse, modulesResponse] = await Promise.all([
                    api.get(`courses/${resolvedCourseId}/`),
                    api.get(`courses/${resolvedCourseId}/modules/`),
                ]);

                setCourse(courseResponse.data);
                setModules(modulesResponse.data);

                // DEBUG: Check what's actually in the modules response
                console.log('Full modules response:', modulesResponse.data);
                if (modulesResponse.data && modulesResponse.data.length > 0) {
                    console.log('First module structure:', modulesResponse.data[0]);
                    console.log('First module content_stats:', modulesResponse.data[0].content_stats);

                    // Check if content_stats exists and has the expected properties
                    const firstModuleStats = modulesResponse.data[0].content_stats;
                    if (firstModuleStats) {
                        console.log('content_stats properties:', Object.keys(firstModuleStats));
                        console.log('total_users_completed value:', firstModuleStats.total_users_completed);
                        console.log('total_contents_course value:', firstModuleStats.total_contents_course);
                    }
                }

                // Fetch time statistics from localStorage
                await fetchTimeStats();
            } catch (error: any) {
                console.error('Failed to fetch course data:', error);
                setError('Failed to load course details');
            } finally {
                setLoading(false);
            }
        };

        fetchCourseData();
    }, [resolvedCourseId]);

    // Auto-start/stop tracking when content is viewed
    useEffect(() => {
        if (viewContentModal) {
            startTimeTracking(viewContentModal.module, viewContentModal.id);
        } else {
            stopTimeTracking();
        }

        // Cleanup on unmount
        return () => {
            if (timeTracking.isTracking) {
                stopTimeTracking();
            }
        };
    }, [viewContentModal]);

    // Update completion requirements when time stats change
    useEffect(() => {
        checkCompletionRequirements();
    }, [userTimeStats, course, modules]);

    const fetchModules = async () => {
        if (!resolvedCourseId) return;
        try {
            const response = await api.get(`courses/${resolvedCourseId}/modules/`);
            setModules(response.data);
        } catch (error) {
            console.error('Failed to fetch modules:', error);
        }
    };

    // Course Status Management
    const updateCourseStatus = async (newStatus: number) => {
        try {
            if (!resolvedCourseId) return;

            const response = await api.patch(
                `courses/${resolvedCourseId}/update-status/`,
                { status: newStatus }
            );

            setCourse(prev => prev ? {
                ...prev,
                status: newStatus,
                status_display: response.data.course.status_display
            } : null);

            alert(`Course status updated to ${response.data.course.status_display}`);
            return response.data;
        } catch (error) {
            console.error('Error updating course status:', error);
            alert('Failed to update course status');
            throw error;
        }
    };

    // Module Status Management
    const updateModuleStatus = async (moduleId: number, newStatus: number) => {
        try {
            const response = await api.patch(
                `courses/${resolvedCourseId}/modules/${moduleId}/update-status/`,
                { status: newStatus }
            );

            setModules(modules.map(module =>
                module.id === moduleId
                    ? { ...module, status: newStatus, status_display: response.data.module.status_display }
                    : module
            ));

            alert(`Module status updated to ${response.data.module.status_display}`);
            return response.data;
        } catch (error) {
            console.error('Error updating module status:', error);
            alert('Failed to update module status');
            throw error;
        }
    };

    // Content Status Management
    const updateContentStatus = async (contentId: number, newStatus: number) => {
        try {
            const response = await api.patch(
                `courses/${resolvedCourseId}/contents/${contentId}/update-status/`,
                { status: newStatus }
            );

            setModules(modules.map(module => ({
                ...module,
                contents: module.contents?.map(content =>
                    content.id === contentId
                        ? { ...content, status: newStatus, status_display: response.data.content.status_display }
                        : content
                ) || []
            })));

            alert(`Content status updated to ${response.data.content.status_display}`);
            return response.data;
        } catch (error) {
            console.error('Error updating content status:', error);
            alert('Failed to update content status');
            throw error;
        }
    };

    // Subscribers and Chat Functions
    const fetchSubscribers = async () => {
        if (!resolvedCourseId) return;

        try {
            setLoadingSubscribers(true);
            const response = await api.get(`courses/${resolvedCourseId}/subscribers/`);
            setSubscribers(response.data.results || response.data);
            setShowSubscribersModal(true);
        } catch (error) {
            console.error('Failed to fetch subscribers:', error);
            alert('Failed to load subscribers');
        } finally {
            setLoadingSubscribers(false);
        }
    };

    const fetchUserProfile = async (userId: number) => {
        try {
            const response = await api.get(`admin/users/${userId}/`);
            setSelectedUser(response.data.user);
            setShowUserProfile(true);
            await fetchChatMessages(userId);
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            const subscriber = subscribers.find(sub => sub.user.id === userId);
            if (subscriber) {
                setSelectedUser({
                    id: subscriber.user.id,
                    username: subscriber.user.username,
                    email: subscriber.user.email,
                    first_name: subscriber.user.full_name?.split(' ')[0] || '',
                    last_name: subscriber.user.full_name?.split(' ').slice(1).join(' ') || '',
                    full_name: subscriber.user.full_name || subscriber.user.username,
                    privilege: 'AP',
                    privilege_display: 'Apprenant',
                    department: subscriber.user.department,
                    department_display: subscriber.user.department_display,
                    date_joined: '',
                    last_login: '',
                    status: 1,
                    status_display: 'Actif',
                    course_count: 0,
                    subscription_count: 0
                });
                setShowUserProfile(true);
            } else {
                alert('Failed to load user profile');
            }
        }
    };

    const fetchChatMessages = async (userId: number) => {
        try {
            setLoadingChat(true);
            const response = await api.get(`chat/messages/${userId}/`);
            setChatMessages(response.data.messages || []);
        } catch (error) {
            console.error('Failed to fetch chat messages, using mock data:', error);
            setChatMessages([
                {
                    id: 1,
                    sender: userId,
                    receiver: 1,
                    message: "Hello! I have a question about the course content.",
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    is_read: true,
                    sender_name: selectedUser?.full_name
                },
                {
                    id: 2,
                    sender: 1,
                    receiver: userId,
                    message: "Hi! I'd be happy to help. What would you like to know?",
                    timestamp: new Date(Date.now() - 1800000).toISOString(),
                    is_read: true
                }
            ]);
        } finally {
            setLoadingChat(false);
        }
    };

    const sendMessage = async () => {
        if (!selectedUser || !newMessage.trim()) return;

        try {
            const response = await api.post(`chat/send/`, {
                receiver_id: selectedUser.id,
                message: newMessage.trim()
            });

            if (response.data.success) {
                setChatMessages(prev => [...prev, response.data.message]);
            } else {
                const newChatMessage: ChatMessage = {
                    id: Date.now(),
                    sender: 1,
                    receiver: selectedUser.id,
                    message: newMessage.trim(),
                    timestamp: new Date().toISOString(),
                    is_read: false
                };
                setChatMessages(prev => [...prev, newChatMessage]);
            }
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message, adding locally:', error);
            const newChatMessage: ChatMessage = {
                id: Date.now(),
                sender: 1,
                receiver: selectedUser.id,
                message: newMessage.trim(),
                timestamp: new Date().toISOString(),
                is_read: false
            };
            setChatMessages(prev => [...prev, newChatMessage]);
            setNewMessage('');
        }
    };

    const markMessageAsRead = async (messageId: number) => {
        try {
            await api.patch(`chat/messages/${messageId}/read/`);
            setChatMessages(prev =>
                prev.map(msg =>
                    msg.id === messageId ? { ...msg, is_read: true } : msg
                )
            );
        } catch (error) {
            console.error('Failed to mark message as read:', error);
            setChatMessages(prev =>
                prev.map(msg =>
                    msg.id === messageId ? { ...msg, is_read: true } : msg
                )
            );
        }
    };

    // Module Creation with Time Tracking
    const handleCreateModule = async () => {
        try {
            if (!resolvedCourseId) return;

            const response = await api.post(`courses/${resolvedCourseId}/modules/`, {
                ...newModuleData,
                order: modules.length + 1,
                status: 0,
                estimated_duration: newModuleData.estimated_duration,
                min_required_time: newModuleData.min_required_time
            });

            setModules([...modules, { ...response.data, contents: [] }]);
            setShowNewModuleModal(false);
            setNewModuleData({
                title: '',
                description: '',
                estimated_duration: undefined,
                min_required_time: undefined
            });
            alert('Module created successfully!');

        } catch (error) {
            console.error('Failed to create module:', error);
            alert('Failed to create module. Please try again.');
        }
    };

    const handleUpdateModule = async () => {
        try {
            if (!selectedModuleForEdit || !resolvedCourseId) return;

            const response = await api.put(`courses/${resolvedCourseId}/modules/${selectedModuleForEdit.id}/`, newModuleData);

            const currentContents = selectedModuleForEdit.contents || [];
            setModules(modules.map(module =>
                module.id === selectedModuleForEdit.id
                    ? { ...response.data, contents: currentContents }
                    : module
            ));
            setShowNewModuleModal(false);
            setSelectedModuleForEdit(null);
            setNewModuleData({
                title: '',
                description: '',
                estimated_duration: undefined,
                min_required_time: undefined
            });
            alert('Module updated successfully!');

        } catch (error) {
            console.error('Failed to update module:', error);
            alert('Failed to update module. Please try again.');
        }
    };

    const handleDeleteModule = async (moduleId: number) => {
        if (!window.confirm('Are you sure you want to archive this module? It will be hidden from students but preserved for reporting.')) {
            return;
        }

        try {
            await updateModuleStatus(moduleId, 2);
            setModules(modules.filter(module => module.id !== moduleId));
            alert('Module archived successfully!');
        } catch (error) {
            console.error('Failed to archive module:', error);
            alert('Failed to archive module. Please try again.');
        }
    };

    // Content Creation with Time Tracking
    const handleCreateContent = async () => {
        try {
            if (!resolvedCourseId || !selectedModule) return;

            let endpoint = '';
            let requestData: any;

            if (selectedContentType === 'pdf') {
                endpoint = `courses/${resolvedCourseId}/modules/${selectedModule}/contents/pdf/`;
                const formData = new FormData();
                formData.append('title', newContentData.title);
                formData.append('caption', newContentData.caption);
                formData.append('order', '1');
                formData.append('module', selectedModule.toString());
                formData.append('status', '1');
                formData.append('estimated_duration', newContentData.estimated_duration?.toString() || '0');
                formData.append('min_required_time', newContentData.min_required_time?.toString() || '0');

                if (newContentData.file) {
                    formData.append('pdf_file', newContentData.file);
                } else {
                    alert('❌ Please select a PDF file');
                    return;
                }

                requestData = formData;
            } else if (selectedContentType === 'Video') {
                endpoint = `courses/${resolvedCourseId}/modules/${selectedModule}/contents/video/`;
                const formData = new FormData();
                formData.append('title', newContentData.title);
                formData.append('caption', newContentData.caption);
                formData.append('order', '1');
                formData.append('module', selectedModule.toString());
                formData.append('status', '1');
                formData.append('estimated_duration', newContentData.estimated_duration?.toString() || '0');
                formData.append('min_required_time', newContentData.min_required_time?.toString() || '0');

                if (newContentData.file) {
                    formData.append('video_file', newContentData.file);
                } else {
                    alert('❌ Please select a video file');
                    return;
                }

                requestData = formData;
            } else if (selectedContentType === 'QCM') {
                endpoint = `courses/${resolvedCourseId}/modules/${selectedModule}/contents/qcm/`;
                requestData = {
                    title: newContentData.title,
                    caption: newContentData.caption,
                    order: 1,
                    module: selectedModule,
                    status: 1,
                    qcm_question: newContentData.questions[0].question,
                    question_type: newContentData.questions[0].question_type,
                    qcm_options: newContentData.questions[0].options.map((option: any) => ({
                        text: option.text,
                        is_correct: option.is_correct
                    })),
                    points: newContentData.points,
                    passing_score: newContentData.passing_score,
                    max_attempts: newContentData.max_attempts,
                    time_limit: newContentData.time_limit,
                    estimated_duration: newContentData.estimated_duration,
                    min_required_time: newContentData.min_required_time
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
                time_limit: 0,
                estimated_duration: undefined,
                min_required_time: undefined
            });

        } catch (error: any) {
            console.error('Failed to create content:', error);
            alert('Failed to create content. Please try again.');
        }
    };

    const handleUpdateContent = async () => {
        try {
            if (!selectedContent || !resolvedCourseId) return;

            let endpoint = '';
            let requestData: any;

            const contentType = selectedContent.content_type_name || selectedContent.content_type;

            if (contentType.toLowerCase() === 'pdf') {
                endpoint = `courses/${resolvedCourseId}/contents/pdf/${selectedContent.id}/`;
                const formData = new FormData();
                formData.append('title', newContentData.title);
                formData.append('caption', newContentData.caption);
                if (newContentData.estimated_duration) {
                    formData.append('estimated_duration', newContentData.estimated_duration.toString());
                }
                if (newContentData.min_required_time) {
                    formData.append('min_required_time', newContentData.min_required_time.toString());
                }

                if (newContentData.file) {
                    formData.append('pdf_file', newContentData.file);
                }

                requestData = formData;
            } else if (contentType.toLowerCase() === 'qcm') {
                endpoint = `courses/${resolvedCourseId}/contents/qcm/${selectedContent.id}/`;
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
                    time_limit: newContentData.time_limit,
                    estimated_duration: newContentData.estimated_duration,
                    min_required_time: newContentData.min_required_time
                };
            } else if (contentType.toLowerCase() === 'video') {
                endpoint = `courses/${resolvedCourseId}/contents/video/${selectedContent.id}/`;
                const formData = new FormData();
                formData.append('title', newContentData.title);
                formData.append('caption', newContentData.caption);
                if (newContentData.estimated_duration) {
                    formData.append('estimated_duration', newContentData.estimated_duration.toString());
                }
                if (newContentData.min_required_time) {
                    formData.append('min_required_time', newContentData.min_required_time.toString());
                }

                if (newContentData.file) {
                    formData.append('video_file', newContentData.file);
                }

                requestData = formData;
            }

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
                time_limit: 0,
                estimated_duration: undefined,
                min_required_time: undefined
            });

        } catch (error: any) {
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
            time_limit: content.qcm?.time_limit || 0,
            estimated_duration: content.estimated_duration,
            min_required_time: content.min_required_time
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
            description: module.description || '',
            estimated_duration: module.estimated_duration,
            min_required_time: module.min_required_time
        });
        setShowNewModuleModal(true);
        setModuleEditMode(true);
    };

    const handleDeleteContent = async (contentId: number, moduleId: number) => {
        if (!window.confirm('Are you sure you want to archive this content? It will be hidden from students but preserved for reporting.')) {
            return;
        }

        try {
            await updateContentStatus(contentId, 2);

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
            alert('Content archived successfully!');
        } catch (error) {
            console.error('Failed to archive content:', error);
            alert('Failed to archive content');
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
        if (!selectedQuizContent || !resolvedCourseId) return;

        try {
            const response = await api.post(`courses/${resolvedCourseId}/contents/qcm/${selectedQuizContent.id}/attempt/`, {
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

    // Status Dropdown Components
    const CourseStatusDropdown: React.FC<{ course: CourseDetailData }> = ({ course }) => {
        const [showDropdown, setShowDropdown] = useState(false);

        const handleStatusChange = async (newStatus: number) => {
            try {
                await updateCourseStatus(newStatus);
                setShowDropdown(false);
            } catch (error) {
                // Error handled in updateCourseStatus
            }
        };

        return (
            <div className="dropdown">
                <button
                    className="btn btn-sm btn-outline-secondary dropdown-toggle"
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                >
                    <StatusBadge status={course.status} statusDisplay={course.status_display} />
                </button>
                {showDropdown && (
                    <div className="dropdown-menu show">
                        <button
                            className="dropdown-item"
                            onClick={() => handleStatusChange(0)}
                            disabled={course.status === 0}
                        >
                            <span className="badge bg-warning text-dark me-2">Draft</span>
                            Set as Draft
                        </button>
                        <button
                            className="dropdown-item"
                            onClick={() => handleStatusChange(1)}
                            disabled={course.status === 1}
                        >
                            <span className="badge bg-success me-2">Active</span>
                            Set as Active
                        </button>
                        <button
                            className="dropdown-item"
                            onClick={() => handleStatusChange(2)}
                            disabled={course.status === 2}
                        >
                            <span className="badge bg-secondary me-2">Archived</span>
                            Set as Archived
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const ModuleStatusDropdown: React.FC<{ module: Module }> = ({ module }) => {
        const [showDropdown, setShowDropdown] = useState(false);

        const handleStatusChange = async (newStatus: number) => {
            try {
                await updateModuleStatus(module.id, newStatus);
                setShowDropdown(false);
            } catch (error) {
                // Error handled in updateModuleStatus
            }
        };

        return (
            <div className="dropdown">
                <button
                    className="btn btn-sm btn-outline-secondary dropdown-toggle"
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                >
                    <StatusBadge status={module.status} statusDisplay={module.status_display} />
                </button>
                {showDropdown && (
                    <div className="dropdown-menu show">
                        <button
                            className="dropdown-item"
                            onClick={() => handleStatusChange(0)}
                            disabled={module.status === 0}
                        >
                            <span className="badge bg-warning text-dark me-2">Draft</span>
                            Set as Draft
                        </button>
                        <button
                            className="dropdown-item"
                            onClick={() => handleStatusChange(1)}
                            disabled={module.status === 1}
                        >
                            <span className="badge bg-success me-2">Active</span>
                            Set as Active
                        </button>
                        <button
                            className="dropdown-item"
                            onClick={() => handleStatusChange(2)}
                            disabled={module.status === 2}
                        >
                            <span className="badge bg-secondary me-2">Archived</span>
                            Set as Archived
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const ContentStatusDropdown: React.FC<{ content: CourseContent; moduleId: number }> = ({ content, moduleId }) => {
        const [showDropdown, setShowDropdown] = useState(false);

        const handleStatusChange = async (newStatus: number) => {
            try {
                await updateContentStatus(content.id, newStatus);
                setShowDropdown(false);
            } catch (error) {
                // Error handled in updateContentStatus
            }
        };

        return (
            <div className="dropdown">
                <button
                    className="btn btn-sm btn-outline-secondary dropdown-toggle"
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                >
                    <StatusBadge status={content.status} statusDisplay={content.status_display} />
                </button>
                {showDropdown && (
                    <div className="dropdown-menu show">
                        <button
                            className="dropdown-item"
                            onClick={() => handleStatusChange(0)}
                            disabled={content.status === 0}
                        >
                            <span className="badge bg-warning text-dark me-2">Draft</span>
                            Set as Draft
                        </button>
                        <button
                            className="dropdown-item"
                            onClick={() => handleStatusChange(1)}
                            disabled={content.status === 1}
                        >
                            <span className="badge bg-success me-2">Active</span>
                            Set as Active
                        </button>
                        <button
                            className="dropdown-item"
                            onClick={() => handleStatusChange(2)}
                            disabled={content.status === 2}
                        >
                            <span className="badge bg-secondary me-2">Archived</span>
                            Set as Archived
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const overallCourseStats = modules.reduce((acc: CourseStats, module, index) => {
        if (module.content_stats) {
            // For course-level stats, take from the first module only
            // These should be identical across all modules since they're course-level stats
            if (index === 0) {
                acc.total_users_enrolled = module.content_stats.total_users_enrolled;
                acc.total_users_completed = module.content_stats.total_users_completed;
                acc.total_modules = module.content_stats.total_modules;
                acc.total_contents_course = module.content_stats.total_contents_course;
                acc.completion_rate = module.content_stats.completion_rate;
                acc.average_progress = module.content_stats.average_progress;
                acc.average_time_spent = module.content_stats.average_time_spent;
                acc.total_time_tracked = module.content_stats.total_time_tracked;
            }

            // Sum up module-specific content counts
            acc.total_contents_module += module.content_stats.total_contents_module;
            acc.pdf_count += module.content_stats.pdf_count;
            acc.video_count += module.content_stats.video_count;
            acc.qcm_count += module.content_stats.qcm_count;
        }
        return acc;
    }, {
        total_users_enrolled: 0,
        total_users_completed: 0,
        total_modules: 0,
        total_contents_course: 0,
        completion_rate: 0,
        average_progress: 0,
        total_contents_module: 0,
        pdf_count: 0,
        video_count: 0,
        qcm_count: 0,
        average_time_spent: 0,
        total_time_tracked: 0
    } as CourseStats); // Add initial value with proper type
    // Add this after your overallCourseStats calculation
    console.log('Overall Course Stats:', overallCourseStats);
    console.log('total_users_completed:', overallCourseStats.total_users_completed);
    console.log('total_contents_course:', overallCourseStats.total_contents_course);
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
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <h1 className="h3 mb-0">{course.title_of_course}</h1>
                                        {course && <CourseStatusDropdown course={course} />}
                                    </div>
                                    <p className="text-muted mb-0">{course.description}</p>
                                </div>
                                {showEditCourseModal && course && (
                                    <div className="modal fade show d-block" tabIndex={-1}>
                                        <div className="modal-dialog">
                                            <div className="modal-content">
                                                <div className="modal-header">
                                                    <h5 className="modal-title">Edit Course: {course.title_of_course}</h5>
                                                    <button type="button" className="btn-close" onClick={() => setShowEditCourseModal(false)}></button>
                                                </div>
                                                <div className="modal-body">
                                                    {/* Add your course edit form here */}
                                                    <p>Edit course form would go here...</p>
                                                </div>
                                                <div className="modal-footer">
                                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditCourseModal(false)}>
                                                        Cancel
                                                    </button>
                                                    <button type="button" className="btn btn-primary" onClick={() => {
                                                        // Handle course update
                                                        setShowEditCourseModal(false);
                                                    }}>
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="modal-backdrop fade show"></div>
                                    </div>
                                )}
                                <div>

                                    <button className="btn btn-primary me-2" onClick={handleEditCourseInternal}

                                    >
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

                            {/* Add course time information */}
                            <div className="mb-3">
                                <strong>Estimated Duration:</strong><br />
                                {course.estimated_duration ? (
                                    <span className="badge bg-primary">
                                        {formatTimeForDisplay(course.estimated_duration * 60)}
                                    </span>
                                ) : (
                                    <span className="text-muted">Not specified</span>
                                )}
                            </div>

                            <div className="mb-3">
                                <strong>Minimum Required Time:</strong><br />
                                {course.min_required_time ? (
                                    <span className="badge bg-warning">
                                        {formatTimeForDisplay(course.min_required_time * 60)}
                                    </span>
                                ) : (
                                    <span className="text-muted">Not specified</span>
                                )}
                            </div>

                            {/* <div className="mb-3">
                                <strong>Your Time Spent:</strong><br />
                                <TimeDisplay 
                                    seconds={userTimeStats.totalCourseTime} 
                                    type="detailed"
                                />
                            </div>

                            {/* Completion Status */}

                            {/* Time Requirement Progress */}
                            <div className="mb-3">
                                <strong>Time Requirement Progress:</strong><br />
                                <TimeRequirementBadge
                                    requiredTime={completionRequirements.course.required}
                                    actualTime={completionRequirements.course.actual}
                                    type="course"
                                />
                            </div>

                            <div className="mb-3">
                                <strong>Status:</strong><br />
                                <StatusBadge status={course.status} statusDisplay={course.status_display} />
                            </div>
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
                        <div
                            className="card-body cursor-pointer"
                            onClick={fetchSubscribers}
                            style={{ cursor: 'pointer' }}
                            title="Click to view all subscribers and their progress"
                        >
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
                                                                        <div className="d-flex align-items-center gap-2 mb-1">
                                                                            <h6 className="mb-0">Module {moduleIndex + 1}: {module.title}</h6>
                                                                            <StatusBadge status={module.status} statusDisplay={module.status_display} />
                                                                        </div>
                                                                        {module.description && (
                                                                            <small className="text-muted">{module.description}</small>
                                                                        )}

                                                                        {/* Time Requirements */}
                                                                        <div className="mt-2">
                                                                            <TimeRequirementBadge
                                                                                requiredTime={completionRequirements.modules[module.id]?.required || 0}
                                                                                actualTime={completionRequirements.modules[module.id]?.actual || 0}
                                                                                type="module"
                                                                            />
                                                                        </div>


                                                                        {module.content_stats && (
                                                                            <CircularStatsDisplay stats={module.content_stats} type="module" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                            <div className="btn-group ms-3">
                                                                <ModuleStatusDropdown module={module} />
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
                                                                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                                                                    <h6 className="card-title mb-0">{content.title}</h6>
                                                                                                    <StatusBadge status={content.status} statusDisplay={content.status_display} />
                                                                                                </div>
                                                                                                {content.caption && (
                                                                                                    <p className="card-text text-muted small mb-2">{content.caption}</p>
                                                                                                )}

                                                                                                {/* Time Requirements for Content */}
                                                                                                <div className="mb-2">
                                                                                                    <TimeRequirementBadge
                                                                                                        requiredTime={completionRequirements.contents[content.id]?.required || 0}
                                                                                                        actualTime={completionRequirements.contents[content.id]?.actual || 0}
                                                                                                        type="content"
                                                                                                    />
                                                                                                </div>

                                                                                                {/* Add time information for content */}
                                                                                                {/* <div className="mb-2">
                                                                                                    <EstimatedTimeDisplay 
                                                                                                        estimatedDuration={getContentEstimatedTime(content)}
                                                                                                        actualTimeSpent={userTimeStats.contentTimes[content.id]}
                                                                                                        type="content"
                                                                                                    />
                                                                                                </div> */}

                                                                                                <div className="d-flex justify-content-between align-items-center">
                                                                                                    <small className="text-muted">
                                                                                                        {content.content_type_name || content.content_type} • Order: {content.order}
                                                                                                    </small>
                                                                                                    <div onClick={(e) => e.stopPropagation()}>
                                                                                                        <ContentStatusDropdown content={content} moduleId={module.id} />
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

            {/* Subscribers Modal */}
            {showSubscribersModal && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-xl">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        <i className="fas fa-users me-2"></i>
                                        Course Subscribers - {course?.title_of_course}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowSubscribersModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    {loadingSubscribers ? (
                                        <div className="text-center py-4">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading subscribers...</span>
                                            </div>
                                            <p className="mt-2">Loading subscribers...</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>User</th>
                                                        <th>Progress</th>
                                                        <th>Time Spent</th>
                                                        <th>Time Requirement</th>
                                                        <th>Score</th>
                                                        <th>Completed</th>
                                                        <th>Subscribed Since</th>
                                                        <th>Status</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {subscribers.map((subscriber) => (
                                                        <tr key={subscriber.id}>
                                                            <td>
                                                                <div
                                                                    className="d-flex align-items-center cursor-pointer"
                                                                    onClick={() => fetchUserProfile(subscriber.user.id)}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    <div className="avatar-placeholder bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                                                                        style={{ width: '40px', height: '40px' }}>
                                                                        <span className="text-white fw-bold">
                                                                            {subscriber.user.full_name?.charAt(0) || subscriber.user.username?.charAt(0) || 'U'}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <div className="fw-bold">{subscriber.user.full_name || subscriber.user.username}</div>
                                                                        <small className="text-muted">{subscriber.user.email}</small>
                                                                        <br />
                                                                        <small className="text-muted">{subscriber.user.department_display}</small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="progress me-2" style={{ height: '20px', width: '100px' }}>
                                                                        <div
                                                                            className={`progress-bar ${subscriber.progress_percentage === 100 ? 'bg-success' : 'bg-primary'}`}
                                                                            style={{ width: `${subscriber.progress_percentage}%` }}
                                                                        >
                                                                            {subscriber.progress_percentage}%
                                                                        </div>
                                                                    </div>
                                                                    <small className="text-muted">
                                                                        {subscriber.completed_contents_count}/{subscriber.total_contents_count}
                                                                    </small>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <TimeDisplay
                                                                    seconds={subscriber.total_time_spent || 0}
                                                                    type="short"
                                                                />
                                                            </td>
                                                            <td>
                                                                {course.min_required_time && (
                                                                    <TimeRequirementBadge
                                                                        requiredTime={course.min_required_time * 60}
                                                                        actualTime={subscriber.total_time_spent || 0}
                                                                        type="course"
                                                                    />
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-info">
                                                                    {subscriber.total_score} pts
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${subscriber.is_completed ? 'bg-success' : 'bg-warning'}`}>
                                                                    {subscriber.is_completed ? 'Completed' : 'In Progress'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <small>
                                                                    {new Date(subscriber.subscribed_at).toLocaleDateString()}
                                                                </small>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${subscriber.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                                                    {subscriber.is_active ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-sm btn-outline-primary me-1"
                                                                    onClick={() => fetchUserProfile(subscriber.user.id)}
                                                                    title="View Profile"
                                                                >
                                                                    <i className="fas fa-user"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-success"
                                                                    onClick={() => {
                                                                        const subscriberUser = subscribers.find(sub => sub.user.id === subscriber.user.id);
                                                                        if (subscriberUser) {
                                                                            setSelectedUser({
                                                                                id: subscriberUser.user.id,
                                                                                username: subscriberUser.user.username,
                                                                                email: subscriberUser.user.email,
                                                                                first_name: subscriberUser.user.full_name?.split(' ')[0] || '',
                                                                                last_name: subscriberUser.user.full_name?.split(' ').slice(1).join(' ') || '',
                                                                                full_name: subscriberUser.user.full_name || subscriberUser.user.username,
                                                                                privilege: 'AP',
                                                                                privilege_display: 'Apprenant',
                                                                                department: subscriberUser.user.department,
                                                                                department_display: subscriberUser.user.department_display,
                                                                                date_joined: '',
                                                                                last_login: '',
                                                                                status: 1,
                                                                                status_display: 'Actif',
                                                                                course_count: 0,
                                                                                subscription_count: 0
                                                                            });
                                                                            setShowUserProfile(true);
                                                                        }
                                                                    }}
                                                                    title="Send Message"
                                                                >
                                                                    <i className="fas fa-comment"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    {!loadingSubscribers && subscribers.length === 0 && (
                                        <div className="text-center py-5">
                                            <i className="fas fa-users fa-3x text-muted mb-3"></i>
                                            <h5 className="text-muted">No subscribers yet</h5>
                                            <p className="text-muted">Users who subscribe to this course will appear here.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <div className="me-auto">
                                        <small className="text-muted">
                                            Total: {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
                                        </small>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowSubscribersModal(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {/* User Profile Modal with Chat */}
            {showUserProfile && selectedUser && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        <i className="fas fa-user me-2"></i>
                                        {selectedUser.full_name}'s Profile
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => {
                                            setShowUserProfile(false);
                                            setSelectedUser(null);
                                            setChatMessages([]);
                                            setNewMessage('');
                                        }}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="card h-100">
                                                <div className="card-header bg-light">
                                                    <h6 className="mb-0">
                                                        <i className="fas fa-info-circle me-2"></i>
                                                        User Information
                                                    </h6>
                                                </div>
                                                <div className="card-body">
                                                    <div className="mb-3">
                                                        <strong>Full Name:</strong>
                                                        <div className="mt-1">{selectedUser.full_name}</div>
                                                    </div>
                                                    <div className="mb-3">
                                                        <strong>Email:</strong>
                                                        <div className="mt-1">{selectedUser.email}</div>
                                                    </div>
                                                    <div className="mb-3">
                                                        <strong>Username:</strong>
                                                        <div className="mt-1">{selectedUser.username}</div>
                                                    </div>
                                                    <div className="mb-3">
                                                        <strong>Department:</strong>
                                                        <div className="mt-1">{selectedUser.department_display}</div>
                                                    </div>
                                                    <div className="mb-3">
                                                        <strong>Role:</strong>
                                                        <div className="mt-1">{selectedUser.privilege_display}</div>
                                                    </div>
                                                    <div className="mb-3">
                                                        <strong>Status:</strong>
                                                        <div className="mt-1">
                                                            <span className={`badge ${selectedUser.status === 1 ? 'bg-success' : 'bg-danger'}`}>
                                                                {selectedUser.status_display}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {selectedUser.date_joined && (
                                                        <div className="mb-3">
                                                            <strong>Member Since:</strong>
                                                            <div className="mt-1">
                                                                {new Date(selectedUser.date_joined).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="card h-100">
                                                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                                    <h6 className="mb-0">
                                                        <i className="fas fa-comments me-2"></i>
                                                        Chat
                                                    </h6>
                                                    <span className="badge bg-primary">
                                                        {chatMessages.filter(msg => !msg.is_read && msg.sender === selectedUser.id).length} unread
                                                    </span>
                                                </div>
                                                <div className="card-body d-flex flex-column">
                                                    {loadingChat ? (
                                                        <div className="text-center py-4">
                                                            <div className="spinner-border text-primary" role="status">
                                                                <span className="visually-hidden">Loading messages...</span>
                                                            </div>
                                                            <p className="mt-2">Loading messages...</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div
                                                                className="chat-messages mb-3 flex-grow-1"
                                                                style={{
                                                                    height: '250px',
                                                                    overflowY: 'auto',
                                                                    border: '1px solid #e9ecef',
                                                                    borderRadius: '0.375rem',
                                                                    padding: '10px',
                                                                    backgroundColor: '#f8f9fa'
                                                                }}
                                                            >
                                                                {chatMessages.length === 0 ? (
                                                                    <div className="text-center text-muted py-4">
                                                                        <i className="fas fa-comments fa-2x mb-2"></i>
                                                                        <p>No messages yet. Start a conversation!</p>
                                                                    </div>
                                                                ) : (
                                                                    chatMessages.map((message) => (
                                                                        <div
                                                                            key={message.id}
                                                                            className={`message mb-2 ${message.sender === selectedUser.id ? 'text-start' : 'text-end'}`}
                                                                            onMouseEnter={() => !message.is_read && message.sender === selectedUser.id && markMessageAsRead(message.id)}
                                                                        >
                                                                            <div
                                                                                className={`d-inline-block p-2 rounded ${message.sender === selectedUser.id ? 'bg-light border' : 'bg-primary text-white'}`}
                                                                                style={{ maxWidth: '80%' }}
                                                                            >
                                                                                <div className="message-text">{message.message}</div>
                                                                                <small className={`d-block mt-1 ${message.sender === selectedUser.id ? 'text-muted' : 'text-white-50'}`}>
                                                                                    {new Date(message.timestamp).toLocaleTimeString()}
                                                                                </small>
                                                                                {!message.is_read && message.sender === selectedUser.id && (
                                                                                    <span className="ms-1 text-primary">●</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                            <div className="chat-input">
                                                                <div className="input-group">
                                                                    <input
                                                                        type="text"
                                                                        className="form-control"
                                                                        placeholder="Type your message..."
                                                                        value={newMessage}
                                                                        onChange={(e) => setNewMessage(e.target.value)}
                                                                        onKeyPress={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                sendMessage();
                                                                            }
                                                                        }}
                                                                    />
                                                                    <button
                                                                        className="btn btn-primary"
                                                                        onClick={sendMessage}
                                                                        disabled={!newMessage.trim()}
                                                                    >
                                                                        <i className="fas fa-paper-plane"></i>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowUserProfile(false);
                                            setSelectedUser(null);
                                            setChatMessages([]);
                                            setNewMessage('');
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

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
            {/* Edit Course Modal */}
            {showEditCourseModal && course && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Edit Course: {course.title_of_course}</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowEditCourseModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Course Title *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    defaultValue={course.title_of_course}
                                                    placeholder="Enter course title"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Status</label>
                                                <select className="form-select" defaultValue={course.status}>
                                                    <option value={0}>Draft</option>
                                                    <option value={1}>Active</option>
                                                    <option value={2}>Archived</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-control"
                                            defaultValue={course.description}
                                            rows={4}
                                            placeholder="Enter course description"
                                        />
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Estimated Duration (minutes)</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    defaultValue={course.estimated_duration}
                                                    min="1"
                                                    placeholder="Estimated duration"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Minimum Required Time (minutes)</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    defaultValue={course.min_required_time}
                                                    min="1"
                                                    placeholder="Minimum required time"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditCourseModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="button" className="btn btn-primary" onClick={() => {
                                        // Handle course update
                                        alert('Course update functionality would be implemented here');
                                        setShowEditCourseModal(false);
                                    }}>
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}
            {/* Enhanced New Module Modal with Time Tracking */}
            {showNewModuleModal && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1}>
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{moduleEditMode ? 'Edit Module' : 'Add New Module'}</h5>
                                    <button type="button" className="btn-close" onClick={() => {
                                        setShowNewModuleModal(false);
                                        setModuleEditMode(false);
                                        setSelectedModuleForEdit(null);
                                        setNewModuleData({
                                            title: '',
                                            description: '',
                                            estimated_duration: undefined,
                                            min_required_time: undefined
                                        });
                                    }}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-6">
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
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Order</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={modules.length + 1}
                                                    disabled
                                                />
                                                <small className="text-muted">Auto-calculated based on existing modules</small>
                                            </div>
                                        </div>
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

                                    {/* Time Configuration Section */}
                                    <div className="card mb-3">
                                        <div className="card-header bg-light">
                                            <h6 className="mb-0">
                                                <i className="fas fa-clock me-2"></i>
                                                Time Configuration
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label">Estimated Duration (minutes)</label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            value={newModuleData.estimated_duration || ''}
                                                            onChange={(e) => setNewModuleData({
                                                                ...newModuleData,
                                                                estimated_duration: e.target.value ? parseInt(e.target.value) : undefined
                                                            })}
                                                            min="1"
                                                            placeholder="Auto-calculated from contents"
                                                        />
                                                        <small className="text-muted">
                                                            Estimated time to complete this module
                                                        </small>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label">
                                                            Minimum Required Time (minutes) *
                                                            <i className="fas fa-asterisk text-danger ms-1" style={{ fontSize: '0.6em' }}></i>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            value={newModuleData.min_required_time || ''}
                                                            onChange={(e) => setNewModuleData({
                                                                ...newModuleData,
                                                                min_required_time: e.target.value ? parseInt(e.target.value) : undefined
                                                            })}
                                                            min="1"
                                                            placeholder="Minimum time required"
                                                            required
                                                        />
                                                        <small className="text-muted">
                                                            Learners must spend at least this time
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Auto-calculation section */}
                                            {selectedModuleForEdit?.contents && selectedModuleForEdit.contents.length > 0 && (
                                                <div className="alert alert-info">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <small>
                                                                <i className="fas fa-info-circle me-1"></i>
                                                                <strong>Contents Total:</strong> {calculateModuleTime(selectedModuleForEdit.contents)} minutes
                                                            </small>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => {
                                                                const totalTime = calculateModuleTime(selectedModuleForEdit.contents || []);
                                                                setNewModuleData(prev => ({
                                                                    ...prev,
                                                                    estimated_duration: totalTime,
                                                                    min_required_time: totalTime
                                                                }));
                                                            }}
                                                        >
                                                            Apply Contents Total
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="alert alert-warning">
                                        <small>
                                            <i className="fas fa-exclamation-triangle me-2"></i>
                                            <strong>Important:</strong> Learners must spend at least the minimum required time
                                            before they can complete this module. This ensures proper learning engagement.
                                        </small>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => {
                                        setShowNewModuleModal(false);
                                        setModuleEditMode(false);
                                        setSelectedModuleForEdit(null);
                                        setNewModuleData({
                                            title: '',
                                            description: '',
                                            estimated_duration: undefined,
                                            min_required_time: undefined
                                        });
                                    }}>
                                        Cancel
                                    </button>
                                    <button type="button" className="btn btn-primary" onClick={moduleEditMode ? handleUpdateModule : handleCreateModule}
                                        disabled={!newModuleData.title || !newModuleData.min_required_time}>
                                        {moduleEditMode ? 'Update Module' : 'Create Module'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {/* Enhanced New Content Modal with Time Tracking */}
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
                                            time_limit: 0,
                                            estimated_duration: undefined,
                                            min_required_time: undefined
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

                                            {/* Enhanced Time Configuration */}
                                            <div className="card mb-3">
                                                <div className="card-header bg-light">
                                                    <h6 className="mb-0">
                                                        <i className="fas fa-clock me-2"></i>
                                                        Time Configuration
                                                    </h6>
                                                </div>
                                                <div className="card-body">
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label">
                                                                    Estimated Duration (minutes) *
                                                                    {selectedContentType === 'pdf' && <span className="text-muted"> - Reading time</span>}
                                                                    {selectedContentType === 'Video' && <span className="text-muted"> - Video length</span>}
                                                                    {selectedContentType === 'QCM' && <span className="text-muted"> - Quiz time</span>}
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    className="form-control"
                                                                    value={newContentData.estimated_duration || ''}
                                                                    onChange={(e) => setNewContentData({
                                                                        ...newContentData,
                                                                        estimated_duration: e.target.value ? parseInt(e.target.value) : undefined
                                                                    })}
                                                                    min="1"
                                                                    placeholder={`Enter estimated duration`}
                                                                    required
                                                                />

                                                                {/* Smart time suggestions */}
                                                                <div className="mt-2">
                                                                    <small className="text-muted d-block mb-1">
                                                                        <strong>Suggested durations:</strong>
                                                                    </small>
                                                                    <div className="btn-group btn-group-sm" role="group">
                                                                        {getTimeSuggestions(selectedContentType).map((suggestion, index) => (
                                                                            <button
                                                                                key={index}
                                                                                type="button"
                                                                                className="btn btn-outline-primary"
                                                                                onClick={() => setNewContentData({
                                                                                    ...newContentData,
                                                                                    estimated_duration: suggestion.value,
                                                                                    min_required_time: suggestion.value
                                                                                })}
                                                                            >
                                                                                {suggestion.label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label">
                                                                    Minimum Required Time (minutes) *
                                                                    <i className="fas fa-asterisk text-danger ms-1" style={{ fontSize: '0.6em' }}></i>
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    className="form-control"
                                                                    value={newContentData.min_required_time || ''}
                                                                    onChange={(e) => setNewContentData({
                                                                        ...newContentData,
                                                                        min_required_time: e.target.value ? parseInt(e.target.value) : undefined
                                                                    })}
                                                                    min="1"
                                                                    placeholder="Minimum time required"
                                                                    required
                                                                />
                                                                <small className="text-muted">
                                                                    Learners must spend at least this time
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Auto-calculation for QCM */}
                                                    {selectedContentType === 'QCM' && (
                                                        <div className="alert alert-warning py-2 mb-3">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <small>
                                                                    <i className="fas fa-calculator me-1"></i>
                                                                    <strong>Auto-calculated time:</strong> {calculateAutoTime('QCM', newContentData)} minutes
                                                                </small>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    onClick={() => {
                                                                        const autoTime = calculateAutoTime('QCM', newContentData);
                                                                        if (autoTime) {
                                                                            setNewContentData(prev => ({
                                                                                ...prev,
                                                                                estimated_duration: autoTime,
                                                                                min_required_time: autoTime
                                                                            }));
                                                                        }
                                                                    }}
                                                                >
                                                                    Apply
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Content-specific guidance */}
                                                    {selectedContentType === 'pdf' && (
                                                        <div className="alert alert-info py-2">
                                                            <small>
                                                                <i className="fas fa-lightbulb me-1"></i>
                                                                <strong>PDF Reading Time:</strong> Average reading speed is 2-3 minutes per page.
                                                                Consider complexity and technical level when setting minimum time.
                                                            </small>
                                                        </div>
                                                    )}

                                                    {selectedContentType === 'Video' && (
                                                        <div className="alert alert-info py-2">
                                                            <small>
                                                                <i className="fas fa-lightbulb me-1"></i>
                                                                <strong>Video Learning Time:</strong> Include time for pausing, note-taking,
                                                                and reviewing key concepts. Minimum time should cover actual video length.
                                                            </small>
                                                        </div>
                                                    )}

                                                    {selectedContentType === 'QCM' && (
                                                        <div className="alert alert-info py-2">
                                                            <small>
                                                                <i className="fas fa-lightbulb me-1"></i>
                                                                <strong>Quiz Time:</strong> Allow sufficient time for reading questions carefully
                                                                and thinking. Complex questions may require more time.
                                                            </small>
                                                        </div>
                                                    )}
                                                </div>
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

                                                                    // Auto-update time estimation
                                                                    const autoTime = calculateAutoTime('QCM', {
                                                                        questions: newQuestions,
                                                                        question_type: e.target.value
                                                                    });
                                                                    if (autoTime && !newContentData.estimated_duration) {
                                                                        setNewContentData(prev => ({ ...prev, estimated_duration: autoTime }));
                                                                    }
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

                                                    {/* Auto-time calculation for QCM */}
                                                    <div className="alert alert-warning py-2 mb-3">
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <small>
                                                                <i className="fas fa-calculator me-1"></i>
                                                                <strong>Auto-calculated time:</strong> {calculateAutoTime('QCM', newContentData)} minutes
                                                            </small>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => {
                                                                    const autoTime = calculateAutoTime('QCM', newContentData);
                                                                    if (autoTime) {
                                                                        setNewContentData(prev => ({
                                                                            ...prev,
                                                                            estimated_duration: autoTime,
                                                                            min_required_time: autoTime
                                                                        }));
                                                                    }
                                                                }}
                                                            >
                                                                Apply
                                                            </button>
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
                                            !newContentData.estimated_duration ||
                                            !newContentData.min_required_time ||
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
                            <div className="text-center mt-4">
                                <button className="btn btn-secondary" onClick={handleBack}>
                                    <i className="bi bi-arrow-left me-2"></i>
                                    Back to Courses
                                </button>
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
                .avatar-placeholder {
                    font-size: 16px;
                }
                .chat-messages {
                    background-color: #f8f9fa;
                }
                .message .bg-light {
                    border: 1px solid #dee2e6;
                }
                .message .bg-primary {
                    border: 1px solid #0d6efd;
                }
                .message-text {
                    word-wrap: break-word;
                }
                .time-display .badge {
                    font-size: 0.75em;
                }
                .time-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .time-requirement-badge {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 4px;
                }
            `}</style>
        </div>
    );
};

export default CourseDetail;