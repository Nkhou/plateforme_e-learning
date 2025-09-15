// CourseDetail.tsx
import React, { useEffect, useState } from 'react';
import api from '../../api/api';

interface CourseDetailProps {
  courseId: number | null;
  onClose: () => void;
}

interface CourseDetailData {
  id: number;
  title: string;
  description: string;
  image: string;
  creator_username: string;
  creator_first_name: string;
  creator_last_name: string;
  created_at: string;
  updated_at: string;
  is_subscribed: boolean;
  progress_percentage: number;
}

interface CourseContent {
  id: number;
  title: string;
  caption: string;
  order: number;
  content_type_name: string;
  is_completed: boolean;
  is_locked: boolean;
  pdf_content?: {
    pdf_file: string;
    is_completed: boolean;
  };
  video_content?: {
    video_file: string;
    is_completed: boolean;
  };
  qcm?: {
    question: string;
    options: QCMOption[];
    is_multiple_choice: boolean;
    passing_score?: number;
  };
  created_at: string;
}

interface QCMOption {
  id: number;
  text: string;
  is_correct: boolean;
}

interface SubscriptionData {
  id: number;
  is_active: boolean;
  progress_percentage: number;
  total_score: number;
  completed_contents: number[];
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
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeContent, setActiveContent] = useState<CourseContent | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedQCMOptions, setSelectedQCMOptions] = useState<number[]>([]);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;

      try {
        setLoading(true);

        // Fetch course and contents
        const [courseResponse, contentsResponse] = await Promise.all([
          api.get(`courses/${courseId}/is-subscribed/`),
          api.get(`courses/${courseId}/contents/`)
        ]);

        const rawContents = contentsResponse.data;
        setCourse(courseResponse.data);
        console.log('Fetched contents (raw):', rawContents);
        
        let subscriptionData: SubscriptionData | null = null;
        try {
          const subscriptionResponse = await api.get(`courses/${courseId}/subscribers/`);
          const subArray = subscriptionResponse.data;
          subscriptionData = subArray.length > 0 ? subArray[0] : null;
          console.log('99999999999999999999', subscriptionData)
          setSubscription(subscriptionData);
        } catch (subErr) {
          console.warn('Subscription fetch failed:', subErr);
        }
        
        // Process contents with lock/completion logic
        const completed = subscriptionData?.completed_contents || [];
        const isActive = subscriptionData?.is_active || false;
        const minOrder = Math.min(...rawContents.map((c: CourseContent) => c.order));

        const updated = rawContents.map((content: CourseContent) => {
          const isFirst = content.order === minOrder;
          const prev = rawContents.find((c: CourseContent) => c.order === content.order - 1);
          const isPrevDone = prev ? prev.is_completed : true;

          return {
            ...content,
            // is_completed: completed.includes(content.id),
            is_locked: !isActive || (!isFirst && !isPrevDone) 
          };
        });


        console.log('updated', updated)

        setContents(updated);
      } catch (err: any) {
        console.error('Failed to fetch course data:', err);
        setError('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  const handleSubscribe = async () => {
    try {
      const response = await api.post(`courses/${courseId}/subscribe/`);
      setSubscription(response.data);

      // Update course to reflect subscription
      if (course) {
        setCourse({
          ...course,
          is_subscribed: true
        });
      }
      console.log('Subscription successful', course);
      alert('Successfully subscribed to the course!');
    } catch (error: any) {
      console.error('Failed to subscribe:', error);
      alert('Failed to subscribe to the course');
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await api.post(`courses/${courseId}/unsubscribe/`);
      setSubscription(null);

      // Update course to reflect unsubscription
      if (course) {
        setCourse({
          ...course,
          is_subscribed: false,
          progress_percentage: 0
        });
      }

      // Reset content completion status
      const updatedContents = contents.map(content => ({
        ...content,
        is_completed: false,
        is_locked: true
      }));

      setContents(updatedContents);
      alert('Successfully unsubscribed from the course!');
    } catch (error: any) {
      console.error('Failed to unsubscribe:', error);
      alert('Failed to unsubscribe from the course');
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Failed to load image:', e.currentTarget.src);
    e.currentTarget.src = '/group.avif';
  };

  const handleContentComplete = async (contentId: number) => {
    try {
      let response;
      
      if (activeContent?.content_type_name === 'QCM') {
        if (selectedQCMOptions.length === 0) {
          alert('Please select at least one answer before submitting.');
          return;
        }

        response = await api.post(`courses/${courseId}/submit-qcm/`, {
          content_id: contentId,
          selected_option_ids: selectedQCMOptions,
          time_taken: 0, 
        });

        // Check if QCM was passed
        if (!response.data.is_passed) {
          alert(`Your score: ${response.data.score}%. You need ${activeContent.qcm?.passing_score || 80}% to pass.`);
          return; // Don't mark as completed if not passed
        }
      } else if (activeContent?.content_type_name === 'pdf') {
        response = await api.post(`courses/${courseId}/completePdf/`, {
          content_id: contentId,
        });
      } else if (activeContent?.content_type_name === 'Video') {
        response = await api.post(`courses/${courseId}/completeVideo/`, {
          content_id: contentId
        });
      } else {
        console.error('Unknown content type:', activeContent?.content_type_name);
        return;
      }

      // Update subscription progress
      setSubscription(response.data);

      // Update course progress
      if (course) {
        setCourse({
          ...course,
          progress_percentage: response.data.progress_percentage
        });
      }

      // Update content completion status
      const updatedContents = contents.map(content => {
        if (content.id === contentId) {
          return {
            ...content,
            is_completed: true,
            is_locked: false
          };
        }

        // Unlock next content if this one was completed
        const completedContent = contents.find(c => c.id === contentId);
        if (completedContent && content.order === completedContent.order + 1) {
          return {
            ...content,
            is_locked: false
          };
        }

        return content;
      });
      
      setContents(updatedContents);
      setShowContentModal(false);
      setActiveContent(null);
      setSelectedQCMOptions([]);

    } catch (error: any) {
      console.error('Failed to mark content as completed:', error);
      alert('Failed to update progress');
    }
  };

  const handleContentClick = (content: CourseContent) => {
    if (content.is_locked) {
      alert('Please complete the previous content first!');
      return;
    }
    setActiveContent(content);
    setSelectedQCMOptions([]); // Reset previous answers
    setShowContentModal(true);
  };

  const renderContentModal = () => {
    if (!activeContent) return null;
// console.log('content.is_completed',contents.is_completed )
    return (
      <div className="modale show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" style={{ color: 'white' }}>{activeContent.title}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => {
                  setShowContentModal(false);
                  setActiveContent(null);
                  setSelectedQCMOptions([]);
                }}
              ></button>
            </div>
            <div className="modal-body">
              {activeContent.content_type_name === 'pdf' && activeContent.pdf_content && (
                <div className="text-center py-4">
                  <div className="mb-3">
                    <i className="bi bi-file-earmark-pdf" style={{ fontSize: '3rem', color: '#dc3545' }}></i>
                  </div>
                  <h5>PDF Document</h5>
                  <p className="text-muted">Click below to view or download the PDF file</p>

                  <div className="d-flex gap-2 justify-content-center">
                    <a
                      href={getFileUrl(activeContent.pdf_content.pdf_file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      <i className="bi bi-eye me-2"></i>View PDF
                    </a>
                  </div>

                  <div className="mt-3 small text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    File: {activeContent.pdf_content.pdf_file.split('/').pop()}
                  </div>
                </div>
              )}

              {activeContent.content_type_name === 'Video' && activeContent.video_content && (
                <div>
                  <video
                    controls
                    width="100%"
                    src={getFileUrl(activeContent.video_content.video_file)}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {activeContent.content_type_name === 'QCM' && activeContent.qcm && (
                <div>
                  <h6 style={{ color: 'white' }}>{activeContent.qcm.question}</h6>
                  <div className="list-group mt-3">
                    {activeContent.qcm.options.map((option, index) => {
                      const isChecked = selectedQCMOptions.includes(option.id);

                      return (
                        <div key={option.id} className="list-group-item">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type={activeContent.qcm?.is_multiple_choice ? 'checkbox' : 'radio'}
                              name="qcmOption"
                              id={`option-${index}`}
                              checked={isChecked}
                              onChange={() => {
                                if (activeContent.qcm?.is_multiple_choice) {
                                  // Toggle in/out of selected list
                                  setSelectedQCMOptions((prev) =>
                                    isChecked ? prev.filter(id => id !== option.id) : [...prev, option.id]
                                  );
                                } else {
                                  // Single choice
                                  setSelectedQCMOptions([option.id]);
                                }
                              }}
                            />
                            <label className="form-check-label" htmlFor={`option-${index}`}>
                              {option.text}
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowContentModal(false);
                  setActiveContent(null);
                  setSelectedQCMOptions([]);
                }}
              >
                Close
              </button>
              {!activeContent.is_completed && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleContentComplete(activeContent.id)}
                >
                  Mark as Completed
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
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
      <div className="row">
        {/* Course Image and Details */}
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="mx-auto" style={{ maxWidth: '250px' }}>
              <img
                src={getImageUrl(course.image)}
                alt={course.title}
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
              
              {/* Progress Bar */}
              {course.is_subscribed && (
                <div className="mb-3 px-3">
                  <strong>Progress: </strong>
                  <div className="progress mt-1">
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${course.progress_percentage}%` }}
                      aria-valuenow={course.progress_percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      {course.progress_percentage}%
                    </div>
                  </div>
                </div>
              )}

              {/* Subscribe/Unsubscribe Button */}
              <div className="text-center mb-3">
                {course.is_subscribed ? (
                  <button
                    className="btn btn-danger"
                    onClick={handleUnsubscribe}
                  >
                    Unsubscribe
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ background: 'rgba(5, 44, 101, 0.9)' }}
                    onClick={handleSubscribe}
                  >
                    Subscribe to Course
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Course Contents Section */}
        <div className="col-md-8">
          <div className="text-center mb-4">
            <h1 className="mb-3">{course.title}</h1>
            <p className="lead">{course.description}</p>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Course Contents</h5>
            </div>
            <div className="card-body">
              {contentLoading ? (
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : contents.length === 0 ? (
                <p className="text-muted">No content available yet.</p>
              ) : (
                <div className="list-group">
                  {contents.sort((a, b) => a.order - b.order).map((content, index) => (
                    <div
                      key={content.id}
                      className={`list-group-item ${content.is_locked ? 'list-group-item-secondary' : ''}`}
                      style={{ cursor: content.is_locked ? 'not-allowed' : 'pointer' }}
                      onClick={() => !content.is_locked && handleContentClick(content)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">
                            {index + 1}. {content.title}
                            <span className="badge bg-secondary ms-2" style={{ color: 'white' }}>
                              {content.content_type_name?.toUpperCase()}
                            </span>
                            {content.is_completed && (
                              <span className="badge bg-success ms-2">
                                Completed
                              </span>
                            )}
                            {content.is_locked && (
                              <span className="badge bg-warning ms-2">
                                Locked
                              </span>
                            )}
                          </h6>
                          {content.caption && (
                            <p className="text-muted mb-2">{content.caption}</p>
                          )}
                        </div>
                        <div>
                          {content.is_completed ? (
                            <i className="bi bi-check-circle-fill text-success"></i>
                          ) : content.is_locked ? (
                            <i className="bi bi-lock-fill text-warning"></i>
                          ) : (
                            <i className="bi bi-play-circle-fill text-primary"></i>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Modal */}
      {showContentModal && renderContentModal()}
    </div>
  );
};

export default CourseDetailShow;