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

const CourseDetailShow: React.FC<CourseDetailProps> = ({ courseId, onClose }) => {
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
    <div className="col-md-4 mb-4 text-center text-md-start">
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

        <div className="card">
          <div className="card-body text-start">
            <h5 className="card-title">Course Details</h5>
            <p><strong>Created by:</strong> {course.creator_first_name} {course.creator_last_name}</p>
            <p><strong>Created on:</strong> {new Date(course.created_at).toLocaleDateString()}</p>
            <p><strong>Last updated:</strong> {new Date(course.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>

    {/* Center: Title + Description + Course Contents */}
    <div className="col-md-8">
      <div className="text-center mb-4">
        <h1 className="mb-3">{course.title_of_course}</h1>
        <p className="lead">{course.description}</p>
      </div>

      {/* Course Contents Section goes here */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Course Contents</h5>
        <div className="progress w-100" style={{ height: '20px' }}>
  <div
    className="progress-bar bg-success"
    role="progressbar"
    style={{ width: '15%' }}
    aria-valuenow={100}
    aria-valuemin={0}
    aria-valuemax={100}
  >
    15%
  </div>
</div>


          {/* <button
            className="btn btn-primary"
            style={{ background: 'rgba(5, 44, 101, 0.9)' }}
            onClick={() => setShowNewContentModal(true)}
          >
            start cours
          </button> */}
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
                    {/* <div>
                      <button className="btn btn-sm btn-outline-secondary me-2">
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteContent(content.id)}
                      >
                        Delete
                      </button>
                    </div> */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
{/* 
      Modal stays outside layout for best behavior */}
      {showNewContentModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          
        </div>
      )}
    </div>
  </div>
</div>

    );
};

export default CourseDetailShow;