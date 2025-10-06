import React, { useEffect, useState } from 'react';
import api from '../../../api/api';

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

interface Module {
  id: number;
  title: string;
  description: string;
  order: number;
  is_completed: boolean;
  is_locked: boolean;
  status: number; // 0: Draft, 1: Active, 2: Archived
  status_display: string;
  contents: CourseContent[];
}

export interface CourseContent {
  id: number;
  title: string;
  caption: string;
  order: number;
  content_type_name: string;
  is_completed: boolean;
  is_locked: boolean;
  status: number; // 0: Draft, 1: Active, 2: Archived
  status_display: string;
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
}

// Helper function to get correct image URL
const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '/group.avif';

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  if (imageUrl.startsWith('/media/')) {
    return imageUrl;
  }

  return `/media/${imageUrl}`;
};

// FIXED Helper function to get file URL
const getFileUrl = (fileUrl: string) => {
  console.log('Processing fileUrl:', fileUrl);
  
  if (!fileUrl) {
    console.warn('Empty fileUrl provided');
    return '';
  }

  // Handle full URLs that contain backend:8000
  if (fileUrl.includes('backend:8000')) {
    const correctedUrl = fileUrl.replace('backend:8000', 'localhost:8000');
    console.log('Replaced backend:8000 with localhost:8000:', correctedUrl);
    return correctedUrl;
  }

  // Handle full URLs that contain localhost:8000 (already correct)
  if (fileUrl.includes('localhost:8000')) {
    console.log('URL already contains localhost:8000:', fileUrl);
    return fileUrl;
  }

  // If it's already a complete URL with http/https, return as-is
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    console.log('Full URL detected:', fileUrl);
    return fileUrl;
  }

  // If it starts with /media/, prepend localhost:8000
  if (fileUrl.startsWith('/media/')) {
    const fullUrl = `http://localhost:8000${fileUrl}`;
    console.log('Added localhost:8000 to media path:', fullUrl);
    return fullUrl;
  }

  // Otherwise, assume it's a media file path and construct full URL
  const fullUrl = `http://localhost:8000/media/${fileUrl}`;
  console.log('Constructed full media URL:', fullUrl);
  return fullUrl;
};

const CourseDetailShow: React.FC<CourseDetailProps> = ({ courseId, onClose }) => {
  const [course, setCourse] = useState<CourseDetailData | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeContent, setActiveContent] = useState<CourseContent | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedQCMOptions, setSelectedQCMOptions] = useState<number[]>([]);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [videoError, setVideoError] = useState(false);

  // Filter only active modules and active contents
  const filterActiveModulesAndContents = (modules: Module[]) => {
    return modules
      .filter(module => module.status === 1) // Only active modules (status 1)
      .map(module => ({
        ...module,
        contents: module.contents
          ? module.contents.filter(content => content.status === 1) // Only active contents
          : []
      }))
      .filter(module => module.contents.length > 0); // Only modules that have active contents
  };

  // Function to calculate content locking logic for active content only
  const calculateContentLockStatus = (modules: Module[], isActive: boolean) => {
    const activeModules = filterActiveModulesAndContents(modules);
    
    return activeModules.map((module: Module, moduleIndex: number) => {
      const moduleContents = module.contents || [];
      
      // Sort contents by order
      const sortedContents = moduleContents.sort((a: CourseContent, b: CourseContent) => a.order - b.order);

      // Process contents within the module with proper previous content checking
      const processedContents = sortedContents.map((content: CourseContent, contentIndex: number) => {
        const isFirstInModule = contentIndex === 0;
        const prevContent = contentIndex > 0 ? sortedContents[contentIndex - 1] : null;
        const isPrevDone = prevContent ? prevContent.is_completed : true;

        // For first content in first module, only check subscription
        const isFirstContentInCourse = moduleIndex === 0 && contentIndex === 0;
        
        // Content is locked if:
        // 1. User is not subscribed OR
        // 2. It's not the first content AND previous content is not completed OR
        // 3. Module is locked
        const contentLocked = !isActive || (!isFirstInModule && !isPrevDone) || module.is_locked;
        
        return {
          ...content,
          is_locked: contentLocked
        };
      });

      // Calculate module completion status (all active contents must be completed)
      const moduleCompleted = processedContents.length > 0 && 
        processedContents.every((content: CourseContent) => content.is_completed);
      
      // Module locking logic:
      // Module is locked if:
      // 1. User is not subscribed OR
      // 2. It's not the first module AND previous module is not completed
      const isFirstModule = moduleIndex === 0;
      const prevModule = moduleIndex > 0 ? activeModules[moduleIndex - 1] : null;
      const isPrevModuleDone = prevModule ? 
        prevModule.contents.every((c: CourseContent) => c.is_completed) : true;
      
      const moduleLocked = !isActive || (!isFirstModule && !isPrevModuleDone);

      return {
        ...module,
        contents: processedContents,
        is_completed: moduleCompleted,
        is_locked: moduleLocked
      };
    });
  };

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;

      try {
        setLoading(true);
        const [courseResponse, modulesResponse] = await Promise.all([
          api.get(`courses/${courseId}/is-subscribed/`),
          api.get(`courses/${courseId}/modules/`)
        ]);
        
        setCourse(courseResponse.data);
        const rawModules = modulesResponse.data;
        console.log('Fetched modules (raw):', rawModules);
        
        let subscriptionData: SubscriptionData | null = null;
        try {
          const subscriptionResponse = await api.get(`courses/${courseId}/my-progress/`);
          console.log('subscriptionResponse.data', subscriptionResponse.data);
          const subArray = subscriptionResponse.data;
          subscriptionData = subArray.length > 0 ? subArray[0] : null;
          console.log('Subscription data:', subscriptionData);
          setSubscription(subscriptionData);
        } catch (subErr) {
          console.warn('Subscription fetch failed:', subErr);
        }
        
        // Process modules and contents with proper locking logic - only active content
        const isActive = subscriptionData?.is_active || false;
        const processedModules = calculateContentLockStatus(rawModules, isActive);

        console.log('Processed modules (active only):', processedModules);
        setModules(processedModules);
      } catch (err: any) {
        console.error('Failed to fetch course data:', err);
        setError('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  const toggleModuleExpansion = (moduleId: number) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

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
      
      // Refresh modules after subscription with proper locking logic
      const modulesResponse = await api.get(`courses/${courseId}/modules/`);
      const rawModules = modulesResponse.data;
      
      const processedModules = calculateContentLockStatus(rawModules, true);
      setModules(processedModules);
      
      alert('Successfully subscribed to the course!');
    } catch (error: any) {
      console.error('Failed to subscribe:', error);
      alert('Failed to subscribe to the course');
    }
  };

  

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Failed to load image:', e.currentTarget.src);
    e.currentTarget.src = '/group.avif';
  };

  const handleVideoError = () => {
    console.error('Video loading error for:', activeContent?.video_content?.video_file);
    setVideoError(true);
  };

  const handleContentComplete = async (contentId: number, moduleId: number) => {
    try {
      let response;
      
      // Normalize content type for comparison (case-insensitive)
      const contentType = activeContent?.content_type_name?.toLowerCase() || '';
      
      if (contentType === 'qcm') {
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
          alert(`Your score: ${response.data.score}%. You need ${activeContent?.qcm?.passing_score || 80}% to pass.`);
          return; // Don't mark as completed if not passed
        }
      } else if (contentType === 'pdf') {
        response = await api.post(`courses/${courseId}/completePdf/`, {
          content_id: contentId,
        });
      } else if (contentType === 'video') {
        response = await api.post(`courses/${courseId}/completeVideo/`, {
          content_id: contentId
        });
      } else {
        console.error('Unknown content type:', activeContent?.content_type_name);
        alert('Unknown content type. Please contact support.');
        return;
      }

      // Update subscription progress
      if (response.data) {
        setSubscription(response.data);
      }

      // Update course progress
      if (course && response.data) {
        setCourse({
          ...course,
          progress_percentage: response.data.progress_percentage || course.progress_percentage
        });
      }
     
      // Update modules and contents completion status with proper unlocking logic
      const updatedModules = modules.map(module => {
        if (module.id === moduleId) {
          const updatedContents = module.contents.map((content, index, contentsArray) => {
            if (content.id === contentId) {
              // Mark this content as completed
              return {
                ...content,
                is_completed: true,
                is_locked: false
              };
            }

            // Unlock the next content in sequence if this one was completed
            const completedContentIndex = contentsArray.findIndex(c => c.id === contentId);
            if (completedContentIndex !== -1 && index === completedContentIndex + 1) {
              return {
                ...content,
                is_locked: false // Unlock the next content
              };
            }

            return content;
          });

          // Check if module is now completed (all contents must be done)
          const moduleCompleted = updatedContents.every(content => content.is_completed);
          
          return {
            ...module,
            contents: updatedContents,
            is_completed: moduleCompleted
          };
        }

        // Unlock next module if current module is completed
        const currentModuleIndex = modules.findIndex(m => m.id === moduleId);
        if (currentModuleIndex !== -1 && module.order === modules[currentModuleIndex].order + 1) {
          const currentModuleCompleted = modules[currentModuleIndex].contents.every(content => content.is_completed);
          if (currentModuleCompleted) {
            return {
              ...module,
              is_locked: false // Unlock the next module
            };
          }
        }

        return module;
      });
      
      setModules(updatedModules);
      setShowContentModal(false);
      setActiveContent(null);
      setSelectedQCMOptions([]);
      setVideoError(false);

      alert('Content marked as completed successfully!');

    } catch (error: any) {
      console.error('Failed to mark content as completed:', error);
      alert('Failed to update progress');
    }
  };

  const handleContentClick = (content: CourseContent, module: Module) => {
    if (module.is_locked) {
      alert('Please complete the previous module first!');
      return;
    }
    if (content.is_locked) {
      // Find which previous content needs to be completed
      const moduleContents = module.contents.sort((a, b) => a.order - b.order);
      const contentIndex = moduleContents.findIndex(c => c.id === content.id);
      
      if (contentIndex > 0) {
        const prevContent = moduleContents[contentIndex - 1];
        alert(`Please complete "${prevContent.title}" first!`);
      } else {
        alert('This content is locked. Please contact support.');
      }
      return;
    }
    
    setActiveContent(content);
    setSelectedQCMOptions([]); // Reset previous answers
    setVideoError(false); // Reset video error
    setShowContentModal(true);
  };

  const openPdfInNewWindow = (pdfUrl: string) => {
    window.open(pdfUrl, '_blank', 'width=800,height=600');
  };

  const downloadFile = (fileUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getContentIcon = (contentType: string) => {
    const type = contentType?.toLowerCase();
    switch (type) {
      case 'pdf': return 'fas fa-file-pdf text-danger';
      case 'video': return 'fas fa-video text-success';
      case 'qcm': return 'fas fa-question-circle text-warning';
      default: return 'fas fa-file text-secondary';
    }
  };

  const renderContentModal = () => {
    if (!activeContent) return null;

    const renderContent = () => {
      const contentType = activeContent.content_type_name?.toLowerCase() || '';
      
      switch (contentType) {
        case 'pdf':
          const pdfUrl = activeContent.pdf_content?.pdf_file ? getFileUrl(activeContent.pdf_content.pdf_file) : null;
          return (
            <div className="text-center">
              <i className="fas fa-file-pdf fa-5x text-danger mb-3"></i>
              <h5>{activeContent.title}</h5>
              {activeContent.caption && <p className="text-muted">{activeContent.caption}</p>}
              
              {pdfUrl ? (
                <div className="mt-4">
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    PDF content is available. Choose an option below to view it.
                  </div>
                  
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-primary"
                      onClick={() => openPdfInNewWindow(pdfUrl)}
                    >
                      <i className="fas fa-external-link-alt me-2"></i>
                      Open PDF in New Window
                    </button>
                    
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => downloadFile(pdfUrl, `${activeContent.title}.pdf`)}
                    >
                      <i className="fas fa-download me-2"></i>
                      Download PDF
                    </button>
                    
                    <a 
                      href={pdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-outline-secondary"
                    >
                      <i className="fas fa-link me-2"></i>
                      Direct Link to PDF
                    </a>
                  </div>
                </div>
              ) : (
                <div className="alert alert-warning mt-3">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  PDF file path not available.
                </div>
              )}
            </div>
          );
        
        case 'video':
          const videoUrl = activeContent.video_content?.video_file ? getFileUrl(activeContent.video_content.video_file) : null;
          return (
            <div>
              <h5>{activeContent.title}</h5>
              {activeContent.caption && <p className="text-muted">{activeContent.caption}</p>}
              
              {videoUrl && !videoError ? (
                <div className="mt-3">
                  <video 
                    controls 
                    className="w-100"
                    style={{ maxHeight: '400px' }}
                    onError={handleVideoError}
                    crossOrigin="anonymous"
                  >
                    <source src={videoUrl} type="video/mp4" />
                    <source src={videoUrl} type="video/webm" />
                    <source src={videoUrl} type="video/ogg" />
                    Your browser does not support the video tag.
                  </video>
                  
                  <div className="mt-2">
                    <a 
                      href={videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary"
                    >
                      <i className="fas fa-external-link-alt me-1"></i>
                      Open in New Tab
                    </a>
                    <button 
                      className="btn btn-sm btn-outline-secondary ms-2"
                      onClick={() => downloadFile(videoUrl, `${activeContent.title}.mp4`)}
                    >
                      <i className="fas fa-download me-1"></i>
                      Download
                    </button>
                  </div>
                </div>
              ) : (
                <div className="alert alert-warning mt-3">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {!videoUrl ? 'Video file path not available.' : 'Unable to load video. File may be missing or in an unsupported format.'}
                  {videoUrl && (
                    <div className="mt-2">
                      <a 
                        href={videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-primary"
                      >
                        Try Direct Link
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        
        case 'qcm':
          return (
            <div>
              <h5>{activeContent.title}</h5>
              {activeContent.caption && <p className="text-muted">{activeContent.caption}</p>}
              {activeContent.qcm ? (
                <div className="mt-3">
                  <div className="alert alert-info">
                    <h6>Quiz Details</h6>
                    <ul className="list-unstyled mb-0">
                      <li><strong>Question:</strong> {activeContent.qcm.question}</li>
                      <li><strong>Type:</strong> {activeContent.qcm.is_multiple_choice ? 'Multiple Choice' : 'Single Choice'}</li>
                      {activeContent.qcm.passing_score && (
                        <li><strong>Passing Score:</strong> {activeContent.qcm.passing_score}%</li>
                      )}
                    </ul>
                  </div>
                  
                  <h6 className="mt-3">Select your answer{activeContent.qcm.is_multiple_choice ? 's' : ''}:</h6>
                  <div className="list-group">
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
                                  setSelectedQCMOptions((prev) =>
                                    isChecked ? prev.filter(id => id !== option.id) : [...prev, option.id]
                                  );
                                } else {
                                  setSelectedQCMOptions([option.id]);
                                }
                              }}
                            />
                            <label className="form-check-label w-100" htmlFor={`option-${index}`}>
                              {option.text}
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Quiz content not available.
                </div>
              )}
            </div>
          );
        
        default:
          return (
            <div className="text-center">
              <i className="fas fa-file fa-5x text-secondary mb-3"></i>
              <h5>{activeContent.title}</h5>
              {activeContent.caption && <p className="text-muted">{activeContent.caption}</p>}
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                This content type ({activeContent.content_type_name}) is not directly viewable here.
              </div>
            </div>
          );
      }
    };

    return (
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">
                <i className={`${getContentIcon(activeContent.content_type_name)} me-2`}></i>
                {activeContent.title}
                {activeContent.is_completed && (
                  <span className="badge bg-success ms-2">Completed</span>
                )}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => {
                  setShowContentModal(false);
                  setActiveContent(null);
                  setSelectedQCMOptions([]);
                  setVideoError(false);
                }}
              ></button>
            </div>
            <div className="modal-body">
              {renderContent()}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowContentModal(false);
                  setActiveContent(null);
                  setSelectedQCMOptions([]);
                  setVideoError(false);
                }}
              >
                Close
              </button>
              {!activeContent.is_completed && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const currentModule = modules.find(module => 
                      module.contents.some(content => content.id === activeContent.id)
                    );
                    if (currentModule) {
                      handleContentComplete(activeContent.id, currentModule.id);
                    }
                  }}
                  disabled={activeContent.content_type_name?.toLowerCase() === 'qcm' && selectedQCMOptions.length === 0}
                >
                  {activeContent.content_type_name?.toLowerCase() === 'qcm' ? 'Submit Answers' : 'Mark as Completed'}
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
                  marginBottom: '1rem',
                  marginTop: '1rem'
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
                {!course.is_subscribed && (
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

        {/* Course Modules and Contents Section */}
        <div className="col-md-8">
          <div className="text-center mb-4">
            <h1 className="mb-3">{course.title}</h1>
            <p className="lead">{course.description}</p>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Course Modules</h5>
              <small className="text-muted">Showing only active modules and content</small>
            </div>
            <div className="card-body">
              {contentLoading ? (
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : modules.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-folder-open fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No active modules available</h5>
                  <p className="text-muted">
                    {course.is_subscribed 
                      ? 'There are currently no active modules in this course.' 
                      : 'Subscribe to the course to access available modules.'
                    }
                  </p>
                </div>
              ) : (
                <div className="accordion" id="modulesAccordion">
                  {modules.sort((a, b) => a.order - b.order).map((module, moduleIndex) => {
                    const isExpanded = expandedModules.includes(module.id);
                    const completedContents = module.contents.filter(content => content.is_completed).length;
                    const totalContents = module.contents.length;

                    return (
                      <div key={module.id} className="accordion-item">
                        <div className="accordion-header">
                          <button
                            className={`accordion-button ${isExpanded ? '' : 'collapsed'} ${module.is_locked ? 'bg-light' : ''}`}
                            type="button"
                            onClick={() => toggleModuleExpansion(module.id)}
                            disabled={module.is_locked}
                          >
                            <div className="d-flex justify-content-between align-items-center w-100 me-3">
                              <div>
                                <h6 className="mb-1">
                                  Module {moduleIndex + 1}: {module.title}
                                  {module.is_completed && (
                                    <span className="badge bg-success ms-2">Completed</span>
                                  )}
                                  {module.is_locked && (
                                    <span className="badge bg-warning ms-2">Locked</span>
                                  )}
                                </h6>
                                {module.description && (
                                  <p className="text-muted mb-0 small">{module.description}</p>
                                )}
                                <small className="text-muted">
                                  Progress: {completedContents}/{totalContents} contents completed
                                </small>
                              </div>
                              <div>
                                {module.is_completed ? (
                                  <i className="bi bi-check-circle-fill text-success fs-5"></i>
                                ) : module.is_locked ? (
                                  <i className="bi bi-lock-fill text-warning fs-5"></i>
                                ) : (
                                  <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} fs-5`}></i>
                                )}
                              </div>
                            </div>
                          </button>
                        </div>
                        
                        {isExpanded && !module.is_locked && (
                          <div className="accordion-collapse collapse show">
                            <div className="accordion-body">
                              {module.contents.length === 0 ? (
                                <p className="text-muted">No active content available in this module.</p>
                              ) : (
                                <div className="list-group">
                                  {module.contents.sort((a, b) => a.order - b.order).map((content, contentIndex) => (
                                    <div
                                      key={content.id}
                                      className={`list-group-item ${content.is_locked ? 'list-group-item-secondary' : 'list-group-item-action'}`}
                                      style={{ 
                                        cursor: content.is_locked ? 'not-allowed' : 'pointer',
                                        opacity: content.is_locked ? 0.6 : 1
                                      }}
                                      onClick={() => handleContentClick(content, module)}
                                    >
                                      <div className="d-flex justify-content-between align-items-center">
                                        <div className="flex-grow-1">
                                          <h6 className="mb-1">
                                            {contentIndex + 1}. {content.title}
                                            <span className="badge bg-secondary ms-2">
                                              {content.content_type_name}
                                            </span>
                                            {content.is_completed && (
                                              <span className="badge bg-success ms-2">Completed</span>
                                            )}
                                            {content.is_locked && (
                                              <span className="badge bg-warning ms-2">Locked</span>
                                            )}
                                          </h6>
                                          {content.caption && (
                                            <p className="text-muted mb-2 small">{content.caption}</p>
                                          )}
                                        </div>
                                        <div>
                                          {content.is_completed ? (
                                            <i className="bi bi-check-circle-fill text-success fs-5"></i>
                                          ) : content.is_locked ? (
                                            <i className="bi bi-lock-fill text-warning fs-5"></i>
                                          ) : (
                                            <i className="bi bi-play-circle-fill text-primary fs-5"></i>
                                          )}
                                        </div>
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

      {/* Content Modal */}
      {showContentModal && (
        <>
          {renderContentModal()}
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* Back Button */}
      <div className="text-center mt-4">
        <button className="btn btn-secondary" onClick={onClose}>
          <i className="bi bi-arrow-left me-2"></i>
          Back to Courses
        </button>
      </div>
    </div>
  );
};

export default CourseDetailShow;