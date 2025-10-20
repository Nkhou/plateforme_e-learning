import React, { useState } from 'react';

interface Course {
  id: number;
  title_of_course: string;
  creator_username: string;
  subscribers_count: number;
  created_at: string;
  image_url?: string;
  status?: string;
  category?: string;
  department?: string;
  total_modules?: number;
}

interface CourseData {
  courses: Array<Course>;
  enrollment_stats: {
    labels: string[];
    data: number[];
  };
}

interface CoursesManagementProps {
  courses: CourseData;
}

const CoursesManagement: React.FC<CoursesManagementProps> = ({ courses }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const DEPARTMENT_CHOICES = [
    { code: 'F', label: 'Finance' },
    { code: 'H', label: 'Human Resources' },
    { code: 'M', label: 'Marketing' },
    { code: 'O', label: 'Operations/Production' },
    { code: 'S', label: 'Sales' }
  ];

  const getDepartmentLabel = (code?: string | null) => {
    if (!code) return '';
    const dept = DEPARTMENT_CHOICES.find(d => d.code === code);
    return dept ? dept.label : code;
  };

  const handleCourseAction = (courseId: number, action: string) => {
    console.log(`${action} course ${courseId}`);
    setOpenMenuId(null);
    // Implement course actions (edit, delete, view, etc.)
  };

  const getStatusColor = (status?: string | null) => {
    if (!status) return '#10B981';
    const lowerStatus = String(status).toLowerCase();
    switch (lowerStatus) {
      case 'published':
      case 'active': return '#10B981';
      case 'draft': return '#F59E0B';
      case 'archived': return '#6B7280';
      default: return '#10B981';
    }
  };

  const getStatusLabel = (status?: string | null) => {
    if (!status) return 'Publié';
    const lowerStatus = String(status).toLowerCase();
    switch (lowerStatus) {
      case 'published':
      case 'active': return 'Publié';
      case 'draft': return 'Brouillon';
      case 'archived': return 'Archivé';
      default: return 'Publié';
    }
  };

  const filteredCourses = courses.courses.filter(course => {
    const courseStatus = course.status ? String(course.status).toLowerCase() : 'active';
    const matchesStatus = statusFilter === 'all' || (courseStatus === statusFilter.toLowerCase());

    // Match by department code (F, H, M, O, S) or category field
    const courseDepartment = course.department || course.category || '';
    const matchesCategory = categoryFilter === 'all' || (courseDepartment === categoryFilter);

    return matchesStatus && matchesCategory;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {/* Header with filters and button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1F2937', margin: 0 }}>
              {filteredCourses.length} formations ajoutées
            </h2>

          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                minWidth: '180px' // optional to keep width consistent
              }}
            >
              <option value="all">Statut &gt; Tous</option>
              <option value="active">Publié</option>
              <option value="draft">Brouillon</option>
              <option value="archived">Archivé</option>
            </select>

            {/* Category/Department Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
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
                minWidth: '220px' // optional to keep width consistent
              }}
            >
              <option value="all">Département &gt; Tous</option>
              {DEPARTMENT_CHOICES.map(dept => (
                <option key={dept.code} value={dept.code}>{dept.label}</option>
              ))}
            </select>

            {/* Button */}
            <button
              style={{
                backgroundColor: '#4338CA',
                color: 'white',
                border: 'none',
                padding: '0.625rem 1.25rem',
                borderRadius: '6px',
                fontSize: '0.9375rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3730A3'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4338CA'}
            >
              + Nouvelle formation
            </button>
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
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Étudiants</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Modules</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Créé le</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Statut</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>...</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course, index) => (
                  <tr
                    key={course.id}
                    style={{
                      borderBottom: '1px solid #E5E7EB',
                      backgroundColor: index % 2 === 0 ? 'white' : '#F9FAFB',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#F9FAFB'}
                  >
                    <td style={{ padding: '0.75rem' }}>
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
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<div style="width: 50px; height: 50px; background-color: #E5E7EB; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #9CA3AF; font-size: 1.5rem;">📚</div>';
                          }}
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
                      <span style={{
                        backgroundColor: '#EEF2FF',
                        color: '#4338CA',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.8125rem',
                        fontWeight: '500'
                      }}>
                        {course.subscribers_count}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#1F2937', textAlign: 'center' }}>
                      {course.total_modules || 0}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#6B7280' }}>
                      {new Date(course.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        color: getStatusColor(course.status || 'active'),
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: getStatusColor(course.status || 'active')
                        }}></span>
                        {getStatusLabel(course.status || 'active')}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', position: 'relative' }}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6B7280',
                          fontSize: '1.25rem',
                          padding: '0.25rem'
                        }}
                      >
                        ⋯
                      </button>
                      {openMenuId === course.id && (
                        <div style={{
                          position: 'absolute',
                          right: '0',
                          top: '100%',
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          zIndex: 1000,
                          minWidth: '180px',
                          marginTop: '0.25rem'
                        }}>
                          <button
                            onClick={() => handleCourseAction(course.id, 'edit')}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            ✏️ Modifier la formation
                          </button>
                          <button
                            onClick={() => handleCourseAction(course.id, 'view')}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            👁️ Voir les détails
                          </button>
                          <button
                            onClick={() => handleCourseAction(course.id, 'duplicate')}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            📋 Dupliquer
                          </button>
                          <hr style={{ margin: '0.25rem 0', border: 'none', borderTop: '1px solid #E5E7EB' }} />
                          <button
                            onClick={() => handleCourseAction(course.id, 'delete')}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: 'transparent',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              color: '#DC2626',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
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
    </div>
  );
};

export default CoursesManagement;