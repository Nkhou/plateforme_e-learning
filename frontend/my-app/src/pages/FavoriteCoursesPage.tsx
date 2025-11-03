// src/pages/favoris.tsx - Version without lucide-react
import React, { useState, useEffect } from 'react';
import api from '../api/api';

interface FavoriteCourse {
  id: number;
  course_id: number;
  course_title: string;
  course_description: string;
  course_department: string;
  course_department_display: string;
  course_status: number;
  course_status_display: string;
  creator_full_name: string;
  creator_first_name: string;
  creator_last_name: string;
  estimated_duration: number;
  min_required_time: number;
  is_subscribed: boolean;
  progress_percentage: number;
  added_at: string;
  course_image: string | null;
}

const FavoriteCoursesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('favorites/');
      const data = response.data.results || response.data;
      setFavorites(data);
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des favoris');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  };

  const handleRemoveFavorite = async (favoriteId: number, courseTitle: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir retirer "${courseTitle}" de vos favoris ?`)) {
      try {
        await api.delete(`favorites/${favoriteId}/`);
        setFavorites(favorites.filter(fav => fav.id !== favoriteId));
        alert('Cours retiré des favoris avec succès');
      } catch (err: any) {
        console.error('Error removing favorite:', err);
        alert(err.response?.data?.message || 'Erreur lors de la suppression du favori');
      }
    }
  };

  const handleViewCourse = (courseId: number) => {
    window.location.href = `/formations/${courseId}`;
  };

  const filteredFavorites = favorites.filter((fav: FavoriteCourse) => {
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'subscribed' && fav.is_subscribed) ||
      (statusFilter === 'not_subscribed' && !fav.is_subscribed);
    
    const deptMatch = departmentFilter === 'all' || fav.course_department === departmentFilter;
    
    return statusMatch && deptMatch;
  });

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? mins : ''}` : `${mins}min`;
  };

  const getProgressColor = (progress: number): string => {
    if (progress === 0) return '#E5E7EB';
    if (progress < 50) return '#EF4444';
    if (progress < 100) return '#F59E0B';
    return '#10B981';
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
          <p style={{ color: '#6B7280' }}>Chargement de vos favoris...</p>
        </div>
      </div>
    );
  }

  if (error && favorites.length === 0) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '28rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ backgroundColor: '#FEE2E2', borderRadius: '50%', width: '4rem', height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <span style={{ fontSize: '2rem' }}>❤️</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>Erreur</h2>
          <p style={{ color: '#6B7280', marginBottom: '1rem' }}>{error}</p>
          <button
            onClick={fetchFavorites}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#4338CA',
              color: 'white',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, #4338CA, #7C3AED)', color: 'white' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>❤️</span>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0 }}>Mes Cours Favoris</h1>
              </div>
              <p style={{ color: '#E0E7FF' }}>
                Retrouvez tous les cours que vous avez sauvegardés
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                padding: '0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              title="Actualiser"
            >
              <span style={{ fontSize: '1.5rem', display: 'block', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>🔄</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Favoris</p>
                <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#4338CA', margin: 0 }}>{favorites.length}</p>
              </div>
              <span style={{ fontSize: '3rem', opacity: 0.2 }}>📚</span>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Cours Inscrits</p>
                <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#10B981', margin: 0 }}>
                  {favorites.filter(f => f.is_subscribed).length}
                </p>
              </div>
              <span style={{ fontSize: '3rem', opacity: 0.2 }}>👤</span>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Progression Moyenne</p>
                <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#7C3AED', margin: 0 }}>
                  {favorites.length > 0 
                    ? Math.round(favorites.reduce((acc, f) => acc + f.progress_percentage, 0) / favorites.length)
                    : 0}%
                </p>
              </div>
              <span style={{ fontSize: '3rem', opacity: 0.2 }}>⏱️</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem', padding: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Statut d'inscription
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="all">Tous</option>
                <option value="subscribed">Inscrits</option>
                <option value="not_subscribed">Non inscrits</option>
              </select>
            </div>

            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Département
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="all">Tous</option>
                <option value="F">FINANCE</option>
                <option value="H">Human RESOURCES</option>
                <option value="M">MARKETING</option>
                <option value="O">OPERATIONS/PRODUCTION</option>
                <option value="S">Sales</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ color: '#6B7280' }}>
            <span style={{ fontWeight: '600' }}>{filteredFavorites.length}</span> cours favoris
            {(statusFilter !== 'all' || departmentFilter !== 'all') && (
              <span style={{ fontSize: '0.875rem', marginLeft: '0.5rem', color: '#9CA3AF' }}>
                (filtré sur {favorites.length} total)
              </span>
            )}
          </p>
        </div>

        {/* Favorites Table */}
        {filteredFavorites.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '3rem', textAlign: 'center' }}>
            <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>❤️</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              Aucun cours favori
            </h3>
            <p style={{ color: '#6B7280' }}>
              {statusFilter !== 'all' || departmentFilter !== 'all'
                ? 'Aucun cours ne correspond à vos filtres'
                : 'Commencez à ajouter des cours à vos favoris'}
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F3F4F6' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Cours</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Créateur</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Département</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Durée</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Progression</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Statut</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ backgroundColor: 'white' }}>
                  {filteredFavorites.map((favorite: FavoriteCourse, index: number) => (
                    <tr 
                      key={favorite.id} 
                      style={{ 
                        borderBottom: '1px solid #E5E7EB',
                        backgroundColor: index % 2 === 0 ? 'white' : '#F9FAFB',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#F9FAFB'}
                      onClick={() => handleViewCourse(favorite.course_id)}
                    >
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                          <div style={{
                            flexShrink: 0,
                            width: '3rem',
                            height: '3rem',
                            backgroundColor: '#EEF2FF',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {favorite.course_image ? (
                              <img 
                                src={favorite.course_image} 
                                alt={favorite.course_title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.5rem' }}
                              />
                            ) : (
                              <span style={{ fontSize: '1.5rem' }}>📚</span>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: '0 0 0.25rem 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {favorite.course_title}
                            </p>
                            <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {favorite.course_description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.875rem', color: '#111827' }}>
                          {favorite.creator_full_name}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          borderRadius: '9999px',
                          backgroundColor: '#EEF2FF',
                          color: '#4338CA'
                        }}>
                          {favorite.course_department_display}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#6B7280' }}>
                          <span>⏱️</span>
                          {formatDuration(favorite.estimated_duration)}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                        <div style={{ width: '8rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#374151' }}>
                              {favorite.progress_percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div style={{ width: '100%', backgroundColor: '#E5E7EB', borderRadius: '9999px', height: '0.5rem' }}>
                            <div
                              style={{
                                height: '0.5rem',
                                borderRadius: '9999px',
                                backgroundColor: getProgressColor(favorite.progress_percentage),
                                width: `${favorite.progress_percentage}%`,
                                transition: 'width 0.3s'
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                        {favorite.is_subscribed ? (
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            borderRadius: '9999px',
                            backgroundColor: '#D1FAE5',
                            color: '#065F46'
                          }}>
                            Inscrit
                          </span>
                        ) : (
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            borderRadius: '9999px',
                            backgroundColor: '#F3F4F6',
                            color: '#374151'
                          }}>
                            Non inscrit
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCourse(favorite.course_id);
                            }}
                            style={{
                              padding: '0.5rem',
                              color: '#4338CA',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EEF2FF'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="Voir le cours"
                          >
                            <span style={{ fontSize: '1.25rem' }}>👁️</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFavorite(favorite.id, favorite.course_title);
                            }}
                            style={{
                              padding: '0.5rem',
                              color: '#DC2626',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="Retirer des favoris"
                          >
                            <span style={{ fontSize: '1.25rem' }}>🗑️</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FavoriteCoursesPage;