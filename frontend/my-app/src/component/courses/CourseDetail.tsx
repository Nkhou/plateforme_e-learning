// CourseDetail.tsx
import React, { useEffect, useState } from 'react';
import api from '../../api/api';

interface CourseDetailProps {
    courseId: number | null;
    onClose: () => void;
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

interface CourseContent {
    id: number;
    title: string;
    caption: string;
    order: number;
    content_type_name: string;
    pdf_content?: {
        pdf_file: string;
    };
    video_content?: {
        video_file: string;
    };
    qcm?: {
        question: string;
        options: QCMOption[];
    };
    created_at: string;
}

interface QCMOption {
    id: number;
    text: string;
    is_correct: boolean;
}

// Helper function to get correct image URL
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

// Helper function to get file URL
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

const CourseDetail: React.FC<CourseDetailProps> = ({ courseId, onClose }) => {
    const [course, setCourse] = useState<CourseDetailData | null>(null);
    const [contents, setContents] = useState<CourseContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [contentLoading, setContentLoading] = useState(false);
    const [error, setError] = useState('');
    const [showNewContentModal, setShowNewContentModal] = useState(false);
    const [selectedContentType, setSelectedContentType] = useState<'pdf' | 'video' | 'qcm' | null>(null);
    const [newContentData, setNewContentData] = useState({
        title: '',
        file: null as File | null,
        video_url: '',
        questions: [] as any[],
    });

    useEffect(() => {
        const fetchCourseData = async () => {
            if (!courseId) return;
            console.log('cours id', courseId);
            try {
                setLoading(true);
                const [courseResponse, contentsResponse] = await Promise.all([
                    api.get(`courses/${courseId}/`),
                    api.get(`courses/${courseId}/contents/`)
                ]);
                setCourse(courseResponse.data);
                setContents(contentsResponse.data);
            } catch (error: any) {
                console.error('Failed to fetch course data:', error);
                setError('Failed to load course details');
            } finally {
                setLoading(false);
            }
        };

        fetchCourseData();
    }, [courseId]);

    const fetchContents = async () => {
        if (!courseId) return;
        try {
            setContentLoading(true);
            const response = await api.get(`courses/${courseId}/contents/`);
            setContents(response.data);
        } catch (error) {
            console.error('Failed to fetch contents:', error);
        } finally {
            setContentLoading(false);
        }
    };

    // ===== FRONTEND DEBUGGING ENHANCEMENTS =====

    // ===== UPDATED CONTENT CREATION (FRONTEND) =====
    const handleCreateContent = async () => {
        try {
            // Validation checks
            if (!courseId || isNaN(Number(courseId))) {
                alert('❌ Invalid course ID. Please refresh the page and try again.');
                return;
            }

            if (!selectedContentType) {
                alert('❌ Please select a content type first');
                return;
            }

            if (!newContentData.title?.trim()) {
                alert('❌ Please enter a title for the content');
                return;
            }

            console.log('=== STARTING CONTENT UPLOAD DEBUG ===');
            console.log('selectedContentType:', selectedContentType);
            console.log('courseId:', courseId);

            let endpoint = '';
            let requestData: any;

            if (selectedContentType === 'pdf') {
                endpoint = `courses/${courseId}/contents/pdf/`;
                const formData = new FormData();
                formData.append('title', newContentData.title.trim());
                formData.append('order', (contents.length + 1).toString());

                if (newContentData.file) {
                    formData.append('pdf_file', newContentData.file);
                } else {
                    alert('❌ Please select a PDF file');
                    return;
                }

                requestData = formData;
            } else if (selectedContentType === 'video') {
                endpoint = `courses/${courseId}/contents/video/`;
                const formData = new FormData();
                formData.append('title', newContentData.title.trim());
                formData.append('order', (contents.length + 1).toString());

                if (newContentData.file) {
                    formData.append('video_file', newContentData.file);
                } else {
                    alert('❌ Please select a video file');
                    return;
                }

                requestData = formData;
            } else if (selectedContentType === 'qcm') {
                endpoint = `courses/${courseId}/contents/qcm/`;

                // CORRECTED: Match the serializer's expected field names
                requestData = {
                    title: newContentData.title.trim(),
                    caption: '', // Add caption if your model has it
                    order: contents.length + 1,
                    // Use the exact field names your serializer expects
                    qcm_question: newContentData.questions[0]?.question || '',
                    qcm_options: newContentData.questions.flatMap((question: any) =>
                        question.options.map((option: any) => ({
                            text: option.text,
                            is_correct: option.is_correct
                        }))
                    ),
                    // Add QCM settings if your model supports them
                    points: 1,
                    passing_score: 80,
                    max_attempts: 3,
                    time_limit: 0
                };

                console.log('QCM request data:', JSON.stringify(requestData, null, 2));
            }

            console.log('Making request to:', endpoint);
            console.log('Request data type:', selectedContentType === 'qcm' ? 'JSON' : 'FormData');

            let response;
            if (selectedContentType === 'qcm') {
                response = await api.post(endpoint, requestData, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            } else {
                response = await api.post(endpoint, requestData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            console.log('✅ SUCCESS! Response:', response.data);
            alert(`✅ ${selectedContentType.toUpperCase()} content created successfully!`);

            // Reset form and close modal
            setShowNewContentModal(false);
            setSelectedContentType(null);
            setNewContentData({
                title: '',
                file: null,
                video_url: '',
                questions: [],
            });

            // Refresh the content list
            fetchContents();

        } catch (error: any) {
            console.log('=== 🚨 ERROR ANALYSIS ===');
            console.error('Error object:', error);

            let errorMessage = 'Unknown error occurred';
            let errorDetails = '';

            if (error.response) {
                console.log('Response status:', error.response.status);
                console.log('Response data:', error.response.data);

                if (error.response.status === 400) {
                    errorMessage = '❌ Validation Error:';
                    if (typeof error.response.data === 'object') {
                        errorDetails = Object.entries(error.response.data)
                            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                            .join('\n');
                    } else {
                        errorDetails = error.response.data;
                    }
                } else if (error.response.status === 500) {
                    errorMessage = '🔗 Server Error: Please check backend implementation';
                } else if (error.response.status === 401) {
                    errorMessage = '🔐 Authentication required';
                } else if (error.response.status === 403) {
                    errorMessage = '🚫 Permission denied';
                } else if (error.response.status === 404) {
                    errorMessage = `❌ Course not found (ID: ${courseId})`;
                }
            } else if (error.request) {
                errorMessage = '🌐 Network Error: Could not connect to server';
            } else {
                errorMessage = `❌ ${error.message}`;
            }

            console.log('👤 User-friendly error:', errorMessage);
            if (errorDetails) {
                alert(`Failed to create content: ${errorMessage}\n\nDetails:\n${errorDetails}`);
            } else {
                alert(`Failed to create content: ${errorMessage}`);
            }
        }
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

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        console.error('Failed to load image:', e.currentTarget.src);
        e.currentTarget.src = '/group.avif';
    };

    const handleDeleteContent = async (contentId: number) => {
        if (!window.confirm('Are you sure you want to delete this content?')) {
            return;
        }

        try {
            await api.delete(`courses/${courseId}/contents/${contentId}/`);
            fetchContents(); // Refresh the contents list
        } catch (error) {
            console.error('Failed to delete content:', error);
            alert('Failed to delete content');
        }
    };

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
            <div className="row align-items-start">
                {/* Left: Image + Course Details */}

                {/* Center: Title + Description + Course Contents */}
                <div className="col-md-12">
                    <div className="text-center mb-4">
                        <h1 className="mb-3">{course.title_of_course}</h1>
                        <p className="lead">{course.description}</p>
                    </div>

                    <div className="col-md-4 mb-4 text-center text-md-start">

                        <div className="card">
                            <div className="mx-auto" style={{ maxWidth: '250px' }}>
                                <img
                                    src={getImageUrl(course.image)}
                                    alt={course.title_of_course}
                                    onError={handleImageError}
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        marginBottom: '1rem'
                                    }}
                                />
                                <div className="card-body text-start">
                                    <h5 className="card-title">Course Details</h5>
                                    <p><strong>Created by:</strong> {course.creator_first_name} {course.creator_last_name}</p>
                                    <p><strong>Created on:</strong> {new Date(course.created_at).toLocaleDateString()}</p>
                                    <p><strong>Last updated:</strong> {new Date(course.updated_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Course Contents Section goes here */}
                    <div className="card ">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Course Contents</h5>
                            <button
                                className="btn btn-primary"
                                style={{ background: 'rgba(5, 44, 101, 0.9)' }}
                                onClick={() => setShowNewContentModal(true)}
                            >
                                + New Content
                            </button>
                        </div>
                        <div className="card-body">
                            {contentLoading ? (
                                <div className="text-center">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : contents.length === 0 ? (
                                <p className="text-muted">No content available yet. Add some content to get started!</p>
                            ) : (
                                <div className="list-group">
                                    {contents.sort((a, b) => a.order - b.order).map((content, index) => (
                                        <div key={content.id} className="list-group-item">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h6 className="mb-1">
                                                        {index + 1}. {content.title}
                                                        <span className="badge bg-secondary ms-2">
                                                            {content.content_type_name?.toUpperCase()}
                                                        </span>
                                                    </h6>
                                                    {content.caption && (
                                                        <p className="text-muted mb-2">{content.caption}</p>
                                                    )}

                                                    {/* PDF Content */}
                                                    {content.content_type_name === 'PDF' && content.pdf_content && (
                                                        <a
                                                            href={getFileUrl(content.pdf_content.pdf_file)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-sm btn-outline-primary me-2"
                                                        >
                                                            📄 View PDF
                                                        </a>
                                                    )}

                                                    {/* Video Content */}
                                                    {content.content_type_name === 'Video' && content.video_content && (
                                                        <a
                                                            href={getFileUrl(content.video_content.video_file)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-sm btn-outline-primary me-2"
                                                        >
                                                            📹 Watch Video
                                                        </a>
                                                    )}

                                                    {/* QCM Content */}
                                                    {content.content_type_name === 'QCM' && content.qcm && (
                                                        <button className="btn btn-sm btn-outline-primary me-2">
                                                            ❓ Take Quiz ({content.qcm.options?.length || 0} questions)
                                                        </button>
                                                    )}

                                                    {/* <small className="text-muted">
                        Added: {new Date(content.created_at).toLocaleDateString()}
                      </small> */}
                                                </div>
                                                <div>
                                                    <button className="btn btn-sm btn-outline-secondary me-2">
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDeleteContent(content.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modal stays outside layout for best behavior */}
                    {showNewContentModal && (
                        <div className="modale show d-block" tabIndex={-1}>
                            <div className="modal-dialog modal-lg">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title" style={{ color: "white" }}>Add New Content</h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() => {
                                                setShowNewContentModal(false);
                                                setSelectedContentType(null);
                                                setNewContentData({
                                                    title: '',
                                                    file: null,
                                                    video_url: '',
                                                    questions: [],
                                                });
                                            }}
                                        ></button>
                                    </div>
                                    <div className="modal-body">
                                        {!selectedContentType ? (
                                            <div className="text-center">
                                                <h6>Choose Content Type</h6>
                                                <div className="d-flex justify-content-center gap-3 mt-3">
                                                    <button
                                                        className="btn btn-outline-primary"
                                                        onClick={() => setSelectedContentType('pdf')}
                                                    >
                                                        📄 PDF
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-primary"
                                                        onClick={() => setSelectedContentType('video')}
                                                    >
                                                        📹 Video
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-primary"
                                                        onClick={() => setSelectedContentType('qcm')}
                                                    >
                                                        ❓ QCM Quiz
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
                                                        onChange={(e) => setNewContentData(prev => ({
                                                            ...prev,
                                                            title: e.target.value
                                                        }))}
                                                        placeholder="Enter content title"
                                                        required
                                                    />
                                                </div>

                                                {selectedContentType === 'pdf' && (
                                                    <div className="mb-3">
                                                        <label className="form-label">Upload PDF File *</label>
                                                        <input
                                                            type="file"
                                                            className="form-control"
                                                            accept=".pdf"
                                                            onChange={(e) => setNewContentData(prev => ({
                                                                ...prev,
                                                                file: e.target.files?.[0] || null
                                                            }))}
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
                                                            onChange={(e) => setNewContentData(prev => ({
                                                                ...prev,
                                                                file: e.target.files?.[0] || null
                                                            }))}
                                                            required
                                                        />
                                                        <small className="text-muted">Supported formats: MP4, AVI, MOV</small>
                                                    </div>
                                                )}

                                                {selectedContentType === 'qcm' && (
                                                    <div>
                                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                                            <h6>Questions</h6>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-primary"
                                                                onClick={addQuestion}
                                                            >
                                                                + Add Question
                                                            </button>
                                                        </div>

                                                        {newContentData.questions.map((question, qIndex) => (
                                                            <div key={qIndex} className="card mb-3">
                                                                <div className="card-body">
                                                                    <div className="mb-3">
                                                                        <label className="form-label">Question {qIndex + 1} *</label>
                                                                        <input
                                                                            type="text"
                                                                            className="form-control"
                                                                            value={question.question}
                                                                            onChange={(e) => {
                                                                                const newQuestions = [...newContentData.questions];
                                                                                newQuestions[qIndex].question = e.target.value;
                                                                                setNewContentData(prev => ({ ...prev, questions: newQuestions }));
                                                                            }}
                                                                            placeholder="Enter question"
                                                                            required
                                                                        />
                                                                    </div>

                                                                    <div className="mb-3">
                                                                        <label className="form-label">Question Type</label>
                                                                        <select
                                                                            className="form-select"
                                                                            value={question.question_type}
                                                                            onChange={(e) => {
                                                                                const newQuestions = [...newContentData.questions];
                                                                                newQuestions[qIndex].question_type = e.target.value;
                                                                                setNewContentData(prev => ({ ...prev, questions: newQuestions }));
                                                                            }}
                                                                        >
                                                                            <option value="single">Single Choice</option>
                                                                            <option value="multiple">Multiple Choice</option>
                                                                        </select>
                                                                    </div>

                                                                    <div className="mb-3">
                                                                        <div className="d-flex justify-content-between align-items-center">
                                                                            <label className="form-label">Options *</label>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-outline-primary"
                                                                                onClick={() => addOption(qIndex)}
                                                                            >
                                                                                + Add Option
                                                                            </button>
                                                                        </div>

                                                                        {question.options.map((option: any, oIndex: any) => (
                                                                            <div key={oIndex} className="input-group mb-2">
                                                                                <input
                                                                                    type="text"
                                                                                    className="form-control"
                                                                                    value={option.text}
                                                                                    onChange={(e) => {
                                                                                        const newQuestions = [...newContentData.questions];
                                                                                        newQuestions[qIndex].options[oIndex].text = e.target.value;
                                                                                        setNewContentData(prev => ({ ...prev, questions: newQuestions }));
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
                                                                                                newQuestions[qIndex].options.forEach((opt: any, idx: any) => {
                                                                                                    opt.is_correct = idx === oIndex;
                                                                                                });
                                                                                            } else {
                                                                                                newQuestions[qIndex].options[oIndex].is_correct = e.target.checked;
                                                                                            }
                                                                                            setNewContentData(prev => ({ ...prev, questions: newQuestions }));
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                if (selectedContentType) {
                                                    setSelectedContentType(null);
                                                } else {
                                                    setShowNewContentModal(false);
                                                }
                                            }}
                                        >
                                            {selectedContentType ? 'Back' : 'Cancel'}
                                        </button>
                                        {selectedContentType && (
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                style={{ background: 'rgba(5, 44, 101, 0.9)' }}
                                                onClick={handleCreateContent}
                                                disabled={
                                                    !newContentData.title ||
                                                    (selectedContentType === 'pdf' && !newContentData.file) ||
                                                    (selectedContentType === 'video' && !newContentData.file) ||
                                                    (selectedContentType === 'qcm' &&
                                                        (newContentData.questions.length === 0 ||
                                                            !newContentData.questions[0]?.question ||
                                                            newContentData.questions[0]?.options.length < 2))
                                                }
                                            >
                                                Create Content
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

    );
};

export default CourseDetail;