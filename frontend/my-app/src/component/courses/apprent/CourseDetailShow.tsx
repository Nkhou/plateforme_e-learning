import React, { useEffect, useState, useRef } from 'react';
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
  estimated_duration: number; // in minutes
  min_required_time: number; // in minutes
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
  estimated_time?: number; // in minutes
  pdf_content?: {
    pdf_file: string;
    is_completed: boolean;
  };
  video_content?: {
    video_file: string;
    is_completed: boolean;
    duration?: number; // in seconds
  };
  qcm?: {
    question: string;
    options: QCMOption[];
    is_multiple_choice: boolean;
    passing_score?: number;
    estimated_time?: number; // in minutes
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
  total_time_spent: number; // in seconds
}

// Timer state interface
interface TimerState {
  isRunning: boolean;
  timeElapsed: number; // in seconds
  targetTime: number; // in seconds
  isCompleted: boolean;
}

// Helper function to format time
const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}min` : ''}`.trim();
  }
};

// Helper function to format seconds to readable time (MM:SS)
const formatSeconds = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Helper function to format seconds to detailed time
const formatSecondsDetailed = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} sec`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min${remainingSeconds > 0 ? ` ${remainingSeconds} sec` : ''}`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  }
};

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

// Calculate total estimated time for the course based on ACTIVE content only
const calculateTotalEstimatedTime = (modules: Module[]): number => {
  const activeModules = filterActiveModulesAndContents(modules);
  let totalMinutes = 0;

  activeModules.forEach(module => {
    module.contents.forEach(content => {
      // Use content's estimated_time if available, otherwise use defaults based on content type
      if (content.estimated_time) {
        totalMinutes += content.estimated_time;
      } else {
        // Default estimates based on content type
        switch (content.content_type_name?.toLowerCase()) {
          case 'video':
            totalMinutes += content.video_content?.duration 
              ? Math.ceil(content.video_content.duration / 60) 
              : 10;
            break;
          case 'pdf':
            totalMinutes += 15;
            break;
          case 'qcm':
            totalMinutes += 5;
            break;
          default:
            totalMinutes += 10;
        }
      }
    });
  });

  return totalMinutes;
};

// Calculate total minimum required time for the course based on ACTIVE content only
const calculateTotalMinRequiredTime = (modules: Module[]): number => {
  const activeModules = filterActiveModulesAndContents(modules);
  let totalMinutes = 0;

  activeModules.forEach(module => {
    module.contents.forEach(content => {
      // For min required time, we might want to use different logic
      // You can adjust this based on your requirements
      if (content.estimated_time) {
        totalMinutes += content.estimated_time; // Or use a different calculation
      } else {
        // Conservative estimates for minimum required time
        switch (content.content_type_name?.toLowerCase()) {
          case 'video':
            totalMinutes += content.video_content?.duration 
              ? Math.ceil(content.video_content.duration / 60) * 0.8 // 80% of estimated time
              : 8;
            break;
          case 'pdf':
            totalMinutes += 12; // Slightly less than estimated
            break;
          case 'qcm':
            totalMinutes += 4; // Slightly less than estimated
            break;
          default:
            totalMinutes += 8;
        }
      }
    });
  });

  return totalMinutes;
};

// Statistics component to show active vs inactive content
const CourseTimeStatistics: React.FC<{ modules: Module[] }> = ({ modules }) => {
  const activeModules = filterActiveModulesAndContents(modules);
  const allModules = modules;
  
  const totalActiveContents = activeModules.reduce((total, module) => total + module.contents.length, 0);
  const totalAllContents = allModules.reduce((total, module) => total + (module.contents?.length || 0), 0);
  
  const activeEstimatedTime = calculateTotalEstimatedTime(modules);
  const activeMinRequiredTime = calculateTotalMinRequiredTime(modules);

  return (
    <div className="card bg-light mb-4">
      <div className="card-header">
        <h6 className="mb-0">
          <i className="fas fa-chart-bar me-2"></i>
          Course Time Statistics
        </h6>
      </div>
      <div className="card-body">
        <div className="row text-center">
          <div className="col-md-3">
            <div className="border rounded p-2 bg-white">
              <small className="text-muted d-block">Active Modules</small>
              <strong className="text-primary">{activeModules.length}</strong>
              <small className="text-muted d-block">of {allModules.length} total</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="border rounded p-2 bg-white">
              <small className="text-muted d-block">Active Contents</small>
              <strong className="text-primary">{totalActiveContents}</strong>
              <small className="text-muted d-block">of {totalAllContents} total</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="border rounded p-2 bg-white">
              <small className="text-muted d-block">Estimated Time</small>
              <strong className="text-success">{formatTime(activeEstimatedTime)}</strong>
              <small className="text-muted d-block">(Active content only)</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="border rounded p-2 bg-white">
              <small className="text-muted d-block">Min Required</small>
              <strong className="text-warning">{formatTime(activeMinRequiredTime)}</strong>
              <small className="text-muted d-block">(Active content only)</small>
            </div>
          </div>
        </div>
        
        {/* Progress bars showing active vs total */}
        <div className="mt-3">
          <div className="d-flex justify-content-between mb-1">
            <small>Module Completion</small>
            <small>{activeModules.length}/{allModules.length}</small>
          </div>
          <div className="progress" style={{ height: '8px' }}>
            <div 
              className="progress-bar bg-primary" 
              style={{ width: `${(activeModules.length / allModules.length) * 100}%` }}
            ></div>
          </div>
          
          <div className="d-flex justify-content-between mb-1 mt-2">
            <small>Content Completion</small>
            <small>{totalActiveContents}/{totalAllContents}</small>
          </div>
          <div className="progress" style={{ height: '8px' }}>
            <div 
              className="progress-bar bg-success" 
              style={{ width: `${(totalActiveContents / totalAllContents) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
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

  // Timer state
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    timeElapsed: 0,
    targetTime: 0,
    isCompleted: false
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate times based on active content only
  const activeEstimatedTime = calculateTotalEstimatedTime(modules);
  const activeMinRequiredTime = calculateTotalMinRequiredTime(modules);

  // Use active times for display, fallback to course times if not available
  const displayEstimatedTime = activeEstimatedTime > 0 ? activeEstimatedTime : (course?.estimated_duration || 0);
  const displayMinRequiredTime = activeMinRequiredTime > 0 ? activeMinRequiredTime : (course?.min_required_time || 0);

  // Simplified content locking logic - only checks if user is active
  const calculateContentLockStatus = (modules: Module[], isActive: boolean) => {
    const activeModules = filterActiveModulesAndContents(modules);

    return activeModules.map((module: Module) => {
      const moduleContents = module.contents || [];

      // Sort contents by order
      const sortedContents = moduleContents.sort((a: CourseContent, b: CourseContent) => a.order - b.order);

      // Process contents within the module - only check if content is active
      const processedContents = sortedContents.map((content: CourseContent) => {
        // Content is locked ONLY if user is not subscribed/active
        const contentLocked = !isActive;

        return {
          ...content,
          is_locked: contentLocked
        };
      });

      // Calculate module completion status (all active contents must be completed)
      const moduleCompleted = processedContents.length > 0 &&
        processedContents.every((content: CourseContent) => content.is_completed);

      // Module locking logic simplified:
      // Module is locked ONLY if user is not subscribed/active
      const moduleLocked = !isActive;

      return {
        ...module,
        contents: processedContents,
        is_completed: moduleCompleted,
        is_locked: moduleLocked
      };
    });
  };

  // Calculate time progress
  const calculateTimeProgress = (): {
    timeProgress: number;
    timeRemaining: number;
    hasMetTimeRequirement: boolean;
  } => {
    if (!subscription || !course) {
      return { timeProgress: 0, timeRemaining: 0, hasMetTimeRequirement: false };
    }

    const requiredTimeSeconds = displayMinRequiredTime * 60; // Use active min required time
    const timeSpentSeconds = subscription.total_time_spent || 0;

    const timeProgress = requiredTimeSeconds > 0
      ? Math.min(100, (timeSpentSeconds / requiredTimeSeconds) * 100)
      : 0;

    const timeRemaining = Math.max(0, requiredTimeSeconds - timeSpentSeconds);
    const hasMetTimeRequirement = timeSpentSeconds >= requiredTimeSeconds;

    return { timeProgress, timeRemaining, hasMetTimeRequirement };
  };

  // Check if user can mark content as completed (time requirement met)
  const canMarkContentCompleted = (): boolean => {
    if (!course || !subscription) return false;

    // If no minimum time requirement, allow completion
    if (displayMinRequiredTime === 0) return true;

    const requiredTimeSeconds = displayMinRequiredTime * 60;
    const timeSpentSeconds = subscription.total_time_spent || 0;

    return timeSpentSeconds >= requiredTimeSeconds;
  };

  // Timer functions
  const startTimer = (targetMinutes: number) => {
    const targetSeconds = targetMinutes * 60;

    setTimer({
      isRunning: true,
      timeElapsed: 0,
      targetTime: targetSeconds,
      isCompleted: false
    });

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Start new timer
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        const newTimeElapsed = prev.timeElapsed + 1;

        if (newTimeElapsed >= prev.targetTime) {
          // Timer completed
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          return {
            ...prev,
            timeElapsed: prev.targetTime,
            isRunning: false,
            isCompleted: true
          };
        }

        return {
          ...prev,
          timeElapsed: newTimeElapsed
        };
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimer(prev => ({
      ...prev,
      isRunning: false
    }));
  };

  const resumeTimer = () => {
    if (timer.isCompleted) return;

    timerRef.current = setInterval(() => {
      setTimer(prev => {
        const newTimeElapsed = prev.timeElapsed + 1;

        if (newTimeElapsed >= prev.targetTime) {
          // Timer completed
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          return {
            ...prev,
            timeElapsed: prev.targetTime,
            isRunning: false,
            isCompleted: true
          };
        }

        return {
          ...prev,
          timeElapsed: newTimeElapsed
        };
      });
    }, 1000);

    setTimer(prev => ({
      ...prev,
      isRunning: true
    }));
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimer({
      isRunning: false,
      timeElapsed: 0,
      targetTime: 0,
      isCompleted: false
    });
  };

  // Calculate timer progress percentage
  const getTimerProgress = (): number => {
    if (timer.targetTime === 0) return 0;
    return Math.min(100, (timer.timeElapsed / timer.targetTime) * 100);
  };

  // Record time to backend when timer completes
  const recordCompletedTime = async () => {
    if (!courseId || !activeContent) return;

    try {
      // Record time tracking to backend
      await api.post(`courses/${courseId}/time-calculation/`, {
        content_id: activeContent.id,
        duration: timer.targetTime, // Total time spent in seconds
        session_type: 'content'
      });

      // Refresh subscription data to update total_time_spent
      const subscriptionResponse = await api.get(`courses/${courseId}/my-progress/`);
      console.log("**************************1111my progress", subscriptionResponse);
      if (Array.isArray(subscriptionResponse.data)) {
        setSubscription(subscriptionResponse.data.length > 0 ? subscriptionResponse.data[0] : null);
      } else {
        setSubscription(subscriptionResponse.data);
      }

      console.log('Time recorded successfully:', timer.targetTime, 'seconds');
    } catch (error) {
      console.error('Failed to record time:', error);
    }
  };

  // Effect to handle timer completion
  useEffect(() => {
    if (timer.isCompleted && activeContent) {
      recordCompletedTime();
    }
  }, [timer.isCompleted, activeContent]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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
        let isActive = false;

        try {
          // Use the my-progress endpoint for students
          const subscriptionResponse = await api.get(`courses/${courseId}/my-progress/`);
          console.log('subscriptionResponse.data', subscriptionResponse.data);

          // Handle both array and object responses
          if (Array.isArray(subscriptionResponse.data)) {
            subscriptionData = subscriptionResponse.data.length > 0 ? subscriptionResponse.data[0] : null;
          } else {
            subscriptionData = subscriptionResponse.data;
          }

          console.log('Subscription data:', subscriptionData);
          setSubscription(subscriptionData);
          isActive = subscriptionData?.is_active || false;

        } catch (subErr: any) {
          console.warn('Subscription fetch failed:', subErr);
          // If we get a 403, user is not the creator - this is expected for students 
          if (subErr.response?.status === 403) {
            console.log('User is not course creator, using basic subscription data');
            // For students, use the subscription status from course data
            isActive = courseResponse.data.is_subscribed;
            subscriptionData = {
              id: 0,
              is_active: courseResponse.data.is_subscribed,
              progress_percentage: courseResponse.data.progress_percentage || 0,
              total_time_spent: 0
            };
            setSubscription(subscriptionData);
          } else {
            // For other errors, fall back to course subscription status
            isActive = courseResponse.data.is_subscribed;
          }
        }

        // Process modules and contents with proper locking logic - only active content
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
    // For QCM, we don't require the timer - only for PDF and Video content
    const contentType = activeContent?.content_type_name?.toLowerCase();
    const isTimedContent = contentType === 'pdf' || contentType === 'video';

    // Check if user has met the minimum time requirement for timed content
    if (isTimedContent && !canMarkContentCompleted() && !timer.isCompleted) {
      const { timeRemaining } = calculateTimeProgress();
      alert(`You need to spend ${formatSecondsDetailed(timeRemaining)} more in this course before you can mark content as completed.`);
      return;
    }

    // For timed content, require timer completion
    if (isTimedContent && !timer.isCompleted) {
      alert('Please complete the required study time before marking this content as completed.');
      return;
    }

    try {
      let response;

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

      // Update modules and contents completion status
      const updatedModules = modules.map(module => {
        if (module.id === moduleId) {
          const updatedContents = module.contents.map(content => {
            if (content.id === contentId) {
              // Mark this content as completed
              return {
                ...content,
                is_completed: true,
                is_locked: false
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
        return module;
      });

      setModules(updatedModules);
      setShowContentModal(false);
      setActiveContent(null);
      setSelectedQCMOptions([]);
      setVideoError(false);
      resetTimer(); // Reset timer when content is completed

      alert('Content marked as completed successfully!');

    } catch (error: any) {
      console.error('Failed to mark content as completed:', error);
      alert('Failed to update progress');
    }
  };

  const handleContentClick = (content: CourseContent, module: Module) => {
    if (module.is_locked) {
      alert('This module is locked. Please subscribe to the course first!');
      return;
    }
    if (content.is_locked) {
      alert('This content is locked. Please subscribe to the course first!');
      return;
    }

    setActiveContent(content);
    setSelectedQCMOptions([]);
    setVideoError(false);
    resetTimer();
    setShowContentModal(true);

    // Define which content types should auto-start timer
    const autoStartContentTypes = ['pdf', 'video']; // Add/remove types as needed

    const contentType = content.content_type_name?.toLowerCase();
    const shouldAutoStart = autoStartContentTypes.includes(contentType) && !content.is_completed;

    if (shouldAutoStart) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        const targetTime = getContentTargetTime(content);
        startTimer(targetTime);
      }, 100);
    }
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

  // Get estimated time for individual content
  const getContentEstimatedTime = (content: CourseContent): string => {
    if (content.estimated_time) {
      return formatTime(content.estimated_time);
    }

    const contentType = content.content_type_name?.toLowerCase();
    switch (contentType) {
      case 'video':
        return content.video_content?.duration ? formatTime(Math.ceil(content.video_content.duration / 60)) : '10 min';
      case 'pdf':
        return '15 min';
      case 'qcm':
        return content.qcm?.estimated_time ? formatTime(content.qcm.estimated_time) : '5 min';
      default:
        return '10 min';
    }
  };

  // Get content target time for timer (in minutes)
  const getContentTargetTime = (content: CourseContent): number => {
    if (content.estimated_time) {
      return content.estimated_time;
    }

    const contentType = content.content_type_name?.toLowerCase();
    switch (contentType) {
      case 'video':
        return content.video_content?.duration ? Math.ceil(content.video_content.duration / 60) : 10;
      case 'pdf':
        return 15;
      case 'qcm':
        return content.qcm?.estimated_time || 5;
      default:
        return 10;
    }
  };

  // Get module estimated time based on active content only
  const getModuleEstimatedTime = (module: Module): number => {
    const activeContents = module.contents.filter(content => content.status === 1);
    
    return activeContents.reduce((total, content) => {
      if (content.estimated_time) {
        return total + content.estimated_time;
      }
      
      // Default estimates for active content
      switch (content.content_type_name?.toLowerCase()) {
        case 'video':
          return total + (content.video_content?.duration ? Math.ceil(content.video_content.duration / 60) : 10);
        case 'pdf':
          return total + 15;
        case 'qcm':
          return total + 5;
        default:
          return total + 10;
      }
    }, 0);
  };

  const renderContentModal = () => {
    if (!activeContent) return null;

    const canComplete = canMarkContentCompleted();
    const { timeRemaining } = calculateTimeProgress();
    const contentType = activeContent.content_type_name?.toLowerCase();
    const isTimedContent = contentType === 'pdf' || contentType === 'video';
    const targetTime = getContentTargetTime(activeContent);
    const timerProgress = getTimerProgress();

    const renderContent = () => {
      switch (contentType) {
        case 'pdf':
          const pdfUrl = activeContent.pdf_content?.pdf_file ? getFileUrl(activeContent.pdf_content.pdf_file) : null;
          return (
            <div className="text-center">
              <i className="fas fa-file-pdf fa-5x text-danger mb-3"></i>
              <h5>{activeContent.title}</h5>
              {activeContent.caption && <p className="text-muted">{activeContent.caption}</p>}

              {/* Time estimate */}
              <div className="alert alert-info">
                <i className="fas fa-clock me-2"></i>
                Estimated study time: {getContentEstimatedTime(activeContent)}
              </div>

              {pdfUrl ? (
                <div className="mt-4">
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

              {/* Time estimate */}
              <div className="alert alert-info">
                <i className="fas fa-clock me-2"></i>
                Estimated study time: {getContentEstimatedTime(activeContent)}
              </div>

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

              {/* Time estimate */}
              <div className="alert alert-info">
                <i className="fas fa-clock me-2"></i>
                Estimated time: {getContentEstimatedTime(activeContent)}
              </div>

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
                  resetTimer();
                }}
              ></button>
            </div>
            <div className="modal-body">
              {/* Time requirement warning */}
              {!canComplete && isTimedContent && course && displayMinRequiredTime > 0 && (
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>Course time requirement not met:</strong> You need to spend {formatSecondsDetailed(timeRemaining)} more in this course before you can mark content as completed.
                </div>
              )}

              {/* Timer Section for timed content */}
              {isTimedContent && (
                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">
                      <i className="fas fa-stopwatch me-2"></i>
                      Study Timer
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="text-center">
                      {/* Timer Display */}
                      <div className="mb-3">
                        <div className="display-4 font-monospace text-primary">
                          {formatSeconds(timer.targetTime - timer.timeElapsed)}
                        </div>
                        <small className="text-muted">
                          {formatSeconds(timer.timeElapsed)} / {formatSeconds(timer.targetTime)}
                        </small>
                      </div>

                      {/* Progress Bar */}
                      <div className="progress mb-3" style={{ height: '10px' }}>
                        <div
                          className={`progress-bar ${timer.isCompleted ? 'bg-success' : 'bg-primary'}`}
                          role="progressbar"
                          style={{ width: `${timerProgress}%` }}
                          aria-valuenow={timerProgress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        ></div>
                      </div>

                      {/* Timer Status */}
                      {timer.isCompleted && (
                        <div className="alert alert-success mt-3">
                          <i className="fas fa-check-circle me-2"></i>
                          <strong>Study time completed!</strong> You can now mark this content as completed.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
                  resetTimer();
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
                  disabled={
                    (activeContent.content_type_name?.toLowerCase() === 'qcm' && selectedQCMOptions.length === 0) ||
                    (isTimedContent && !timer.isCompleted)
                  }
                  title={
                    isTimedContent && !timer.isCompleted
                      ? 'Complete the study timer first'
                      : activeContent.content_type_name?.toLowerCase() === 'qcm' && selectedQCMOptions.length === 0
                        ? 'Select at least one answer'
                        : ''
                  }
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

  // Calculate time statistics
  const { timeProgress, timeRemaining, hasMetTimeRequirement } = calculateTimeProgress();
  const timeSpentSeconds = subscription?.total_time_spent || 0;
  const canCompleteContent = canMarkContentCompleted();

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

                {/* Enhanced Time Information */}
                <div className="mt-3">
                  <div className="border-start border-3 border-primary ps-3">
                    <h6 className="text-primary">Time Information (Active Content)</h6>
                    <p className="mb-1">
                      <strong>Estimated Duration:</strong> 
                      <span className="text-success"> {formatTime(displayEstimatedTime)}</span>
                    </p>
                    {displayMinRequiredTime > 0 && (
                      <p className="mb-1">
                        <strong>Minimum Required:</strong> 
                        <span className="text-warning"> {formatTime(displayMinRequiredTime)}</span>
                      </p>
                    )}
                    
                    {/* Show original times if different */}
                    {(course.estimated_duration !== displayEstimatedTime || course.min_required_time !== displayMinRequiredTime) && (
                      <div className="mt-2 p-2 bg-light rounded">
                        <small className="text-muted">
                          <strong>Original times (all content):</strong><br />
                          Estimated: {formatTime(course.estimated_duration || 0)}<br />
                          {course.min_required_time > 0 && `Min Required: ${formatTime(course.min_required_time)}`}
                        </small>
                      </div>
                    )}
                  </div>

                  {!canCompleteContent && displayMinRequiredTime > 0 && (
                    <div className="alert alert-warning py-2 mt-2">
                      <small>
                        <i className="fas fa-clock me-1"></i>
                        Spend {formatSecondsDetailed(timeRemaining)} more to unlock content completion
                      </small>
                    </div>
                  )}
                </div>

                {course.is_subscribed && subscription && (
                  <>
                    <p className="mt-2"><strong>Time Spent:</strong> {formatSecondsDetailed(timeSpentSeconds)}</p>
                    {displayMinRequiredTime > 0 && (
                      <p>
                        <strong>Time Requirement:</strong>
                        <span className={hasMetTimeRequirement ? 'text-success' : 'text-warning'}>
                          {hasMetTimeRequirement ? ' Met' : ' Not Met'}
                        </span>
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Progress Bar */}
              {course.is_subscribed && (
                <div className="mb-3 px-3">
                  <strong>Content Progress: </strong>
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

              {/* Time Progress Bar (if minimum time is required) */}
              {course.is_subscribed && displayMinRequiredTime > 0 && (
                <div className="mb-3 px-3">
                  <strong>Time Progress: </strong>
                  <div className="progress mt-1">
                    <div
                      className={`progress-bar ${hasMetTimeRequirement ? 'bg-success' : 'bg-info'}`}
                      role="progressbar"
                      style={{ width: `${timeProgress}%` }}
                      aria-valuenow={timeProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      {Math.round(timeProgress)}%
                    </div>
                  </div>
                  <small className="text-muted">
                    {hasMetTimeRequirement
                      ? 'Time requirement met'
                      : `${formatSecondsDetailed(timeRemaining)} remaining`
                    }
                  </small>
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

            {/* Add the time statistics component */}
            <CourseTimeStatistics modules={modules} />

            {/* Course Time Summary */}
            <div className="row text-center mb-4">
              <div className="col-md-4">
                <div className="card bg-light">
                  <div className="card-body">
                    <h6 className="card-title">Estimated Duration</h6>
                    <p className="card-text h5 text-success">{formatTime(displayEstimatedTime)}</p>
                    <small className="text-muted">Active content only</small>
                  </div>
                </div>
              </div>
              {displayMinRequiredTime > 0 && (
                <div className="col-md-4">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="card-title">Minimum Required</h6>
                      <p className="card-text h5 text-warning">{formatTime(displayMinRequiredTime)}</p>
                      <small className="text-muted">Active content only</small>
                    </div>
                  </div>
                </div>
              )}
              {course.is_subscribed && subscription && (
                <div className="col-md-4">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="card-title">Time Spent</h6>
                      <p className="card-text h5 text-primary">{formatSecondsDetailed(timeSpentSeconds)}</p>
                      <small className="text-muted">
                        {hasMetTimeRequirement ? 'Requirement met' : 'In progress'}
                      </small>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Time Requirement Warning Banner */}
            {course.is_subscribed && displayMinRequiredTime > 0 && !canCompleteContent && (
              <div className="alert alert-warning">
                <i className="fas fa-clock me-2"></i>
                <strong>Time requirement:</strong> You need to spend {formatSecondsDetailed(timeRemaining)} more in this course before you can mark content as completed.
              </div>
            )}
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

                    // Calculate module estimated time based on active content
                    const moduleEstimatedTime = getModuleEstimatedTime(module);

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
                                <div className="d-flex gap-3">
                                  <small className="text-muted">
                                    Progress: {completedContents}/{totalContents} contents
                                  </small>
                                  <small className="text-muted">
                                    <i className="fas fa-clock me-1"></i>
                                    {formatTime(moduleEstimatedTime)}
                                  </small>
                                </div>
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
                                      className={`list-group-item ${content.is_locked ? 'list-group-item-secondary' : 'list-group-item-action'} ${!canCompleteContent && !content.is_completed ? 'opacity-75' : ''
                                        }`}
                                      style={{
                                        cursor: content.is_locked ? 'not-allowed' : 'pointer',
                                      }}
                                      onClick={() => handleContentClick(content, module)}
                                      title={!canCompleteContent && !content.is_completed ? `Spend ${formatSecondsDetailed(timeRemaining)} more in the course to complete this content` : ''}
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
                                            {!canCompleteContent && !content.is_completed && displayMinRequiredTime > 0 && (
                                              <span className="badge bg-info ms-2" title={`Time requirement not met - ${formatSecondsDetailed(timeRemaining)} remaining`}>
                                                <i className="fas fa-clock me-1"></i>
                                                Time Locked
                                              </span>
                                            )}
                                          </h6>
                                          {content.caption && (
                                            <p className="text-muted mb-2 small">{content.caption}</p>
                                          )}
                                          <small className="text-muted">
                                            <i className="fas fa-clock me-1"></i>
                                            {getContentEstimatedTime(content)}
                                          </small>
                                        </div>
                                        <div>
                                          {content.is_completed ? (
                                            <i className="bi bi-check-circle-fill text-success fs-5"></i>
                                          ) : content.is_locked ? (
                                            <i className="bi bi-lock-fill text-warning fs-5"></i>
                                          ) : !canCompleteContent && displayMinRequiredTime > 0 ? (
                                            <i className="bi bi-clock-history text-info fs-5" title={`Time requirement not met - ${formatSecondsDetailed(timeRemaining)} remaining`}></i>
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