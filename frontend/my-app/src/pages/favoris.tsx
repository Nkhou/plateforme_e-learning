import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import CourseImage from "../component/courses/CourseImage";

interface Course {
  id: number;
  title_of_course: string;
  description: string;
  image_url: string | null;
  department_display: string;
  estimated_duration: number;
  creator_full_name: string;
  is_subscribed: boolean;
  creator_username: string;
  creator_id: number;
  status?: any;
  department?: string;
  category?: string;
  is_favorited: boolean;
  progress_percentage: number;
  created_at: string;
  total_modules?: number;
  subscribers_count: number;
  module_count?: number;
  total_duration_minutes?: number;
  subscriber_count?: number;
}

interface CourseData {
  courses: Array<Course>;
  enrollment_stats: {
    labels: string[];
    data: number[];
  };
}

interface CoursesManagementProps {
  courses?: CourseData;
}

const CourseListWithFavorites: React.FC<CoursesManagementProps> = ({ courses: initialCourses }) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseData>({
    courses: [],
    enrollment_stats: { labels: [], data: [] }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Format duration from minutes to "Xh Ym" format
  const formatDuration = (minutes: number | undefined): string => {
    if (!minutes) return '1h 55m';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Fetch courses from backend
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('courses/');
      console.log('API Response:', response.data);
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        setCourses({
          courses: response.data,
          enrollment_stats: { labels: [], data: [] }
        });
      } else if (response.data && response.data.courses) {
        setCourses(response.data);
      } else {
        console.warn('Unexpected API response structure:', response.data);
        setCourses({
          courses: [],
          enrollment_stats: { labels: [], data: [] }
        });
      }
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch courses';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch course details including modules, duration, and learners
  const fetchCourseDetails = async (courseId: number): Promise<Course> => {
    try {
      console.log('Fetching details for course:', courseId);
      const response = await api.get(`courses/${courseId}/`);
      console.log('Course details response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching details for course ${courseId}:`, error);
      // Return default values if API fails
      return {
        id: courseId,
        module_count: 5,
        total_duration_minutes: 115,
        subscriber_count: 32
      } as Course;
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (courseId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click navigation

    try {
      // Check if course is already favorited
      const course = courses.courses.find(c => c.id === courseId);
      const isCurrentlyFavorited = course?.is_favorited;

      if (isCurrentlyFavorited) {
        // Unfavorite - delete the favorite
        await api.delete(`favorites/${courseId}/`);
      } else {
        // Favorite - create new favorite
        await api.post(`courses/favorites/toggle/`, { course_id: courseId });
      }

      // Toggle the favorite status in local state
      setCourses(prev => ({
        ...prev,
        courses: prev.courses.map(course =>
          course.id === courseId
            ? { ...course, is_favorited: !isCurrentlyFavorited }
            : course
        )
      }));

    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      alert(`Failed to update favorite. Error: ${error.response?.data?.message || 'Unknown error'}`);
    }
  };

  // Subscribe to a course
  const handleSubscribeToCourse = async (courseId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const response = await api.post(`courses/${courseId}/subscribe/`);
      if (response.status === 200) {
        alert('Inscription réussie !');
        // Update the course subscription status
        setCourses(prev => ({
          ...prev,
          courses: prev.courses.map(course =>
            course.id === courseId
              ? { ...course, is_subscribed: true, progress_percentage: 0 }
              : course
          )
        }));
      }
    } catch (err: any) {
      console.error('Error subscribing to course:', err);
      const errorMessage = err.response?.data?.error || 'Erreur lors de l\'inscription au cours';
      alert(errorMessage);
    }
  };

  const handleCardClick = (courseId: number) => {
    navigate(`/cours/${courseId}`);
  };

  useEffect(() => {
    if (initialCourses) {
      setCourses(initialCourses);
      setLoading(false);
    } else {
      fetchCourses();
    }
  }, [initialCourses]);

  // Filter only favorited courses
  const favoritedCourses = courses.courses.filter(course => course.is_favorited);

  // Filter logic with safe status handling
  const filteredCourses = favoritedCourses.filter(course => {
    const courseStatus = course.status === 1 ? 'Actif' : course.status === 0 ? 'Brouillon' : 'Archivé';
    const matchesStatus = statusFilter === 'all' || courseStatus === statusFilter;

    // Department/Category filter
    const courseDepartment = course.department || course.category || '';
    const matchesCategory = categoryFilter === 'all' || courseDepartment === categoryFilter;

    return matchesStatus && matchesCategory;
  });

  // Loading state
  if (loading) {
    return (
      <div style={{
        padding: '2rem 3rem',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh'
      }}>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        padding: '2rem 3rem',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh'
      }}>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button
          onClick={fetchCourses}
          style={{
            backgroundColor: '#4338CA',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            fontSize: '0.9375rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3730A3'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4338CA'}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className='container' style={{
      padding: '2rem 3rem',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',

    }}>
      <style>
        {`
          .course-image-container {
            position: relative;
            width: 100%;
            padding-bottom: 40%;
            overflow: hidden;
          }
          .course-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        `}
      </style>

      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h3 style={{ 
            fontWeight: '600', 
            marginBottom: '0.5rem', 
            color: '#1a1a1a',
            fontSize: '1.5rem'
          }}>
            Formations favorites
          </h3>
          <p style={{ 
            fontSize: '0.95rem', 
            color: '#666', 
            marginBottom: '0' 
          }}>
            {filteredCourses.length} formation{filteredCourses.length !== 1 ? 's' : ''} favorite{filteredCourses.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Filters */}
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="row g-4">
          {filteredCourses.map(course => (
            <div key={course.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
              <div
                onClick={() => handleCardClick(course.id)}
                style={{
                  cursor: 'pointer',
                  height: '100%',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div className="course-image-container">
                    <CourseImage
                      src={course.image_url}
                      fallback="/group.avif"
                      alt={course.title_of_course}
                      className="course-image"
                      style={{
                        backgroundColor: '#E8E8F5'
                      }}
                    />
                  </div>
                  {course.is_subscribed && (
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      left: 0,
                      right: 0,
                      height: '6px',
                      background: `linear-gradient(90deg, 
                        #C85B3C ${course.progress_percentage || 0}%, 
                        transparent ${course.progress_percentage || 0}%)`
                    }}></div>
                  )}
                </div>
                <div style={{ padding: '1rem' }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span style={{
                      backgroundColor: course.is_subscribed ? '#FFE4D6' : '#E3F2FD',
                      color: course.is_subscribed ? '#C85B3C' : '#1976D2',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px'
                    }}>
                      {course.department || course.category || 'Finance'}
                    </span>
                    <button
                      onClick={(e) => toggleFavorite(course.id, e)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontSize: '1.25rem',
                        cursor: 'pointer',
                        padding: '0',
                        color: course.is_favorited ? '#FFD700' : '#ddd',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = course.is_favorited ? '#FFD700' : '#ffcc00';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = course.is_favorited ? '#FFD700' : '#ddd';
                      }}
                    >
                      {course.is_favorited ? '★' : '☆'}
                    </button>
                  </div>
                  <h5 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: '#1a1a1a',
                    lineHeight: '1.3'
                  }}>
                    {course.title_of_course}
                  </h5>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#666',
                    marginBottom: '1rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.4'
                  }}>
                    {course.description}
                  </p>
                  <div className="d-flex justify-content-between align-items-center" style={{
                    fontSize: '0.8rem',
                    color: '#666',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <span>📚 {course.module_count || course.total_modules || 5} modules</span>
                    <span>🕐 {formatDuration(course.total_duration_minutes || course.estimated_duration)}</span>
                    <span>👥 {course.subscriber_count || course.subscribers_count || 32} apprenants</span>
                  </div>
                  <button
                    onClick={(e) => {
                      if (course.is_subscribed) {
                        handleCardClick(course.id);
                      } else {
                        handleSubscribeToCourse(course.id, e);
                      }
                    }}
                    style={{
                      width: '100%',
                      marginTop: '1rem',
                      backgroundColor: course.is_subscribed 
                        ? (course.progress_percentage === 100 ? '#8B92C4' : '#C85B3C')
                        : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.625rem',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {course.is_subscribed 
                      ? (course.progress_percentage === 100 ? 'Relire la formation' : 'Continuer la lecture')
                      : "S'inscrire et commencer"
                    }
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          padding: '3rem', 
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem', color: '#1a1a1a' }}>
            Aucune formation favorite
          </div>
          <div style={{ fontSize: '0.95rem', color: '#666' }}>
            {favoritedCourses.length === 0 
              ? "Vous n'avez pas encore de formations favorites. Ajoutez des étoiles aux formations que vous aimez !"
              : "Aucune formation ne correspond à vos filtres actuels."
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseListWithFavorites;