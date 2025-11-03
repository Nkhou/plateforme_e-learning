import React, { useState, useEffect } from 'react';
// import { Heart, Clock, Users, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import FavoriteButton from './FavoriteButton';
import { favoritesService } from './favoritesService';

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
  created_at:string;
  total_modules?: number;
  subscribers_count: number;
}
interface CourseData {
  courses: Array<Course>;
  enrollment_stats: {
    labels: string[];
    data: number[];
  };
}
interface Student {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  department: string;
  department_display: string;
  subscribed_at: string;
  progress_percentage: number;
  total_score: number;
  is_completed: boolean;
  total_time_spent: number;
  total_modules:number;
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
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [changingStatus, setChangingStatus] = useState<number | null>(null);
  const [showStudentsModal, setShowStudentsModal] = useState<number | null>(null);
  const [studentsLoading, setStudentsLoading] = useState<number | null>(null);
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [currentCourseTitle, setCurrentCourseTitle] = useState<string>('');
  const [showNewCours, setShowNewCours] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const DEPARTMENT_CHOICES = [
    { code: 'F', label: 'Finance' },
    { code: 'H', label: 'Human Resources' },
    { code: 'M', label: 'Marketing' },
    { code: 'O', label: 'Operations/Production' },
    { code: 'S', label: 'Sales' }
  ];

  const STATUS_CHOICES = [
    { value: 'Brouillon', label: 'Brouillon', color: '#F59E0B', numeric: 0 },
    { value: 'Actif', label: 'Actif', color: '#10B981', numeric: 1 },
    { value: 'Archivé', label: 'Archivé', color: '#6B7280', numeric: 2 }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-menu-container]')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Fetch students for a specific course
  const fetchCourseStudents = async (courseId: number) => {
    try {
      setStudentsLoading(courseId);
      const response = await api.get(`courses/${courseId}/students/`);
      
      console.log('Students API Response:', response.data);
      
      // Type assertion for students response
      const studentsResponse = response.data as {
        students?: Student[];
        course_title?: string;
      };
      
      if (studentsResponse && studentsResponse.students) {
        setStudentsData(studentsResponse.students);
        setCurrentCourseTitle(studentsResponse.course_title || '');
        setShowStudentsModal(courseId);
      } else {
        alert('Aucun étudiant trouvé pour ce cours');
      }
    } catch (err: any) {
      console.error('Error fetching students:', err);
      const errorMessage = err.response?.data?.error || 'Erreur lors du chargement des étudiants';
      alert(errorMessage);
    } finally {
      setStudentsLoading(null);
    }
  };

  // Subscribe to a course
  const handleSubscribeToCourse = async (courseId: number) => {
    try {
      const response = await api.post(`courses/${courseId}/subscribe/`);
      if (response.status === 200) {
        alert('Inscription réussie !');
        fetchCourses();
      }
    } catch (err: any) {
      console.error('Error subscribing to course:', err);
      const errorMessage = err.response?.data?.error || 'Erreur lors de l\'inscription au cours';
      alert(errorMessage);
    }
  };

  useEffect(() => {
    if (initialCourses) {
      setCourses(initialCourses);
      setLoading(false);
    } else {
      fetchCourses();
    }
  }, [initialCourses]);

  const getDepartmentLabel = (code?: string | null) => {
    if (!code) return '';
    const dept = DEPARTMENT_CHOICES.find(d => d.code === code);
    return dept ? dept.label : code;
  };

  // Safe status value extraction
  const getStatusValue = (status: any): string => {
    if (!status && status !== 0) return '';
    
    // If status is a number, map to French string
    if (typeof status === 'number') {
      const statusMap: { [key: number]: string } = {
        0: 'Brouillon',
        1: 'Actif', 
        2: 'Archivé'
      };
      return statusMap[status] || '';
    }
    
    // If status is a string, return it directly
    if (typeof status === 'string') {
      return status;
    }
    
    // If status is an object with a value property
    if (typeof status === 'object' && status.value) {
      return String(status.value);
    }
    
    // If status is an object with other properties, try common field names
    if (typeof status === 'object') {
      return String(status.name || status.status || status.id || '');
    }
    
    // Fallback
    return String(status);
  };

  const handleCourseClick = (courseId: number) => {
    navigate(`/cours/${courseId}`);
  };

  const handleChangeStatus = async (courseId: number, newStatus: string) => {
    console.log(`Changing course ${courseId} to status: ${newStatus}`);
    setChangingStatus(courseId);
    setOpenMenuId(null);
    
    try {
      // Find the status choice to get numeric value
      const statusChoice = STATUS_CHOICES.find(s => s.value === newStatus);
      
      if (!statusChoice) {
        throw new Error(`Invalid status: ${newStatus}`);
      }

      const response = await api.patch(`courses/${courseId}/`, {
        status: statusChoice.numeric
      });

      if (response.status === 200) {
        // Update local state with numeric status (backend returns numeric)
        setCourses(prev => ({
          ...prev,
          courses: prev.courses.map(course =>
            course.id === courseId
              ? { ...course, status: statusChoice.numeric }
              : course
          )
        }));
        alert('Statut mis à jour avec succès');
      } else {
        throw new Error('Failed to update status');
      }
    } catch (err: any) {
      console.error('Error updating course status:', err);
      const errorMessage = err.response?.data?.error || 'Erreur lors de la mise à jour du statut';
      alert(errorMessage);
    } finally {
      setChangingStatus(null);
    }
  };

  const handleCourseAction = async (courseId: number, action: string) => {
    console.log(`${action} course ${courseId}`);
    setOpenMenuId(null);
    
    try {
      switch (action) {
        case 'delete':
          if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {
            return;
          }
          
          const deleteResponse = await api.delete(`courses/${courseId}/`);

          if (deleteResponse.status === 200 || deleteResponse.status === 204) {
            setCourses(prev => ({
              ...prev,
              courses: prev.courses.filter(course => course.id !== courseId)
            }));
            alert('Formation supprimée avec succès');
          } else {
            throw new Error('Failed to delete course');
          }
          break;

        case 'edit':
          const courseToEdit = courses.courses.find(course => course.id === courseId);
          if (courseToEdit) {
            setEditingCourse(courseToEdit);
          }
          break;

        case 'view':
          navigate(`/cours/${courseId}`);
          break;

        case 'duplicate':
          const duplicateResponse = await api.post(`courses/${courseId}/duplicate/`);
          if (duplicateResponse.status === 200 || duplicateResponse.status === 201) {
            alert('Formation dupliquée avec succès');
            fetchCourses();
          }
          break;

        case 'show_students':
          await fetchCourseStudents(courseId);
          break;

        case 'subscribe':
          await handleSubscribeToCourse(courseId);
          break;

        default:
          console.log('Unknown action:', action);
      }
    } catch (err: any) {
      console.error('Error performing course action:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Action failed';
      setError(errorMessage);
      alert('Une erreur est survenue. Veuillez réessayer.');
    }
  };

  // Safe status color getter
  const getStatusColor = (status: any) => {
    const statusValue = getStatusValue(status);
    const statusChoice = STATUS_CHOICES.find(s => s.value === statusValue);
    return statusChoice ? statusChoice.color : '#6B7280';
  };

  // Safe status label getter
  const getStatusLabel = (status: any) => {
    const statusValue = getStatusValue(status);
    const statusChoice = STATUS_CHOICES.find(s => s.value === statusValue);
    return statusChoice ? statusChoice.label : 'Non défini';
  };

  // Filter logic with safe status handling
  const filteredCourses = (courses?.courses || []).filter(course => {
    const courseStatus = getStatusValue(course.status);
    const matchesStatus = statusFilter === 'all' || courseStatus === statusFilter;

    // Department/Category filter
    const courseDepartment = course.department || course.category || '';
    const matchesCategory = categoryFilter === 'all' || courseDepartment === categoryFilter;

    return matchesStatus && matchesCategory;
  });

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    const parent = target.parentElement;
    if (parent) {
      parent.innerHTML = `
        <div style="width: 50px; height: 50px; background-color: #E5E7EB; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #9CA3AF; font-size: 1.5rem;">
          📚
        </div>
      `;
    }
  };


  // Loading state
  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          padding: '3rem', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <div style={{ fontSize: '1rem', fontWeight: '500', color: '#374151' }}>
            Chargement des formations...
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          padding: '3rem', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <div style={{ fontSize: '1rem', fontWeight: '500', color: '#DC2626', marginBottom: '1rem' }}>
            Erreur: {error}
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
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* {showStudentsModal && <StudentsModal />}
      {editingCourse && <EditCourseModal />}
       */}
      {!showNewCours && (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {/* Header with filters and button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1F2937', margin: 0 }}>
                {filteredCourses.length} formation{filteredCourses.length !== 1 ? 's' : ''} favorite {filteredCourses.length !== 1 ? 's' : ''}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  backgroundColor: '#EEF2FF',
                  border: '1px solid #C7D2FE',
                  borderRadius: '6px',
                  padding: '0.5rem 2rem 0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#4338CA',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%234338CA\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  minWidth: '180px'
                }}
              >
                <option value="all">Statut &gt; Tous</option>
                <option value="Actif">Actif</option>
                <option value="Brouillon">Brouillon</option>
                <option value="Archivé">Archivé</option>
              </select>
              
              {/* Category/Department Filter */}
              
            </div>
          </div>

          {/* Courses Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#E5E7EB' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Image</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Titre de la formation</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Créateur</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Étudiants</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Modules</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Créé le</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course:Course, index:any) => {
                    const courseStatusValue = getStatusValue(course.status);
                    const statusColor = getStatusColor(course.status);
                    const statusLabel = getStatusLabel(course.status);
                    
                    return (
                      <tr
                        key={course.id}
                        style={{
                          borderBottom: '1px solid #E5E7EB',
                          backgroundColor: index % 2 === 0 ? 'white' : '#F9FAFB',
                          transition: 'background-color 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#F9FAFB'}
                        onClick={() => handleCourseClick(course.id)}
                      >
                        <td style={{ padding: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
                          {course.image_url ? (
                            <img
                              src={course.image_url.startsWith('http') ? course.image_url : `${window.location.protocol}//${window.location.hostname}:8000${course.image_url}`}
                              alt={course.title_of_course}
                              style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                                border: '1px solid #E5E7EB'
                              }}
                              onError={handleImageError}
                            />
                          ) : (
                            <div style={{
                              width: '50px',
                              height: '50px',
                              backgroundColor: '#E5E7EB',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#9CA3AF',
                              fontSize: '1.5rem'
                            }}>
                              📚
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: '500', color: '#1F2937' }}>
                            {course.title_of_course}
                          </div>
                          {(course.department || course.category) && (
                            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                              {getDepartmentLabel(course.department || course.category)}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#6B7280' }}>{course.creator_username}</td>
                        <td style={{ padding: '0.75rem', color: '#1F2937', textAlign: 'center' }}>
                          <span 
                            style={{
                              backgroundColor: '#EEF2FF',
                              color: '#4338CA',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.8125rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCourseAction(course.id, 'show_students');
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E0E7FF'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EEF2FF'}
                            title="Afficher tous les étudiants"
                          >
                            {course.subscribers_count} étudiant{course.subscribers_count !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', color: '#1F2937', textAlign: 'center' }}>
                          {course.total_modules || 0}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#6B7280' }}>
                          {new Date(course.created_at).toLocaleDateString('fr-FR', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </td>
                        <td style={{ padding: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
                          {changingStatus === course.id ? (
                            <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                              Mise à jour...
                            </span>
                          ) : (
                            <span style={{
                              color: statusColor,
                              fontWeight: '500',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: statusColor
                              }}></span>
                              {statusLabel}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                      <div style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>Aucune formation trouvée</div>
                      <div style={{ fontSize: '0.875rem' }}>Essayez de modifier vos filtres ou créez une nouvelle formation</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Load More Button */}
          {filteredCourses.length > 0 && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button
                style={{
                  backgroundColor: '#8B5A3C',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '6px',
                  fontSize: '0.9375rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#78472A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8B5A3C'}
              >
                Afficher plus de résultat
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseListWithFavorites;
