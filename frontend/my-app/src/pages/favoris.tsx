import React, { useState, useEffect } from 'react';
// import { Heart, Clock, Users, BookOpen } from 'lucide-react';
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
  is_favorited: boolean;
  progress_percentage: number;
}

const CourseListWithFavorites: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Replace with your actual API call
      const response = await fetch('/api/courses/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        }
      });
      const data = await response.json();
      setCourses(data.results || data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = (courseId: number, isFavorited: boolean) => {
    // Update local state optimistically
    setCourses(courses.map(course => 
      course.id === courseId 
        ? { ...course, is_favorited: isFavorited }
        : course
    ));
  };

  const handleViewCourse = (courseId: number) => {
    window.location.href = `/courses/${courseId}`;
  };

  const handleSubscribe = async (courseId: number) => {
    // Implement subscription logic
    console.log('Subscribe to course:', courseId);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins} min`;
  };

  const filteredCourses = showFavoritesOnly 
    ? courses.filter(course => course.is_favorited)
    : courses;

  const favoritesCount = courses.filter(c => c.is_favorited).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Formations Disponibles</h1>
              <p className="mt-2 text-sm text-gray-600">
                {filteredCourses.length} cours disponibles
                {showFavoritesOnly && ` (${favoritesCount} favoris)`}
              </p>
            </div>
            
            {/* Favorites Filter Toggle */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                ${showFavoritesOnly 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
                ❤️
              {/* <Heart className={`w-5 h-5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              {showFavoritesOnly ? 'Tous les cours' : `Favoris (${favoritesCount})`} */}
            </button>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            ❤️
            {/* <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" /> */}
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {showFavoritesOnly ? 'Aucun cours favori' : 'Aucun cours disponible'}
            </h3>
            <p className="text-gray-500">
              {showFavoritesOnly 
                ? 'Commencez à ajouter des cours à vos favoris'
                : 'Il n\'y a pas de cours disponibles pour le moment'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
              >
                {/* Course Image */}
                <div className="relative h-48 bg-gradient-to-r from-indigo-500 to-purple-600">
                  {course.image_url ? (
                    <img
                      src={course.image_url}
                      alt={course.title_of_course}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      {/* <BookOpen className="w-16 h-16 text-white opacity-50" /> */}
                    📖
                    </div>
                  )}
                  
                  {/* Favorite Button Overlay */}
                  <div className="absolute top-4 right-4">
                    <FavoriteButton
                      courseId={course.id}
                      isFavorited={course.is_favorited}
                      onToggle={(isFavorited) => handleFavoriteToggle(course.id, isFavorited)}
                      size="lg"
                      className="shadow-lg"
                    />
                  </div>

                  {/* Subscription Badge */}
                  {course.is_subscribed && (
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                        Inscrit
                      </span>
                    </div>
                  )}
                </div>

                {/* Course Content */}
                <div className="p-6">
                  {/* Course Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {course.title_of_course}
                  </h3>

                  {/* Creator */}
                  <p className="text-sm text-gray-600 mb-3">
                    Par {course.creator_full_name}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Meta Information */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                        ⏱️
                      {/* <Clock className="w-4 h-4" /> */}
                      <span>{formatDuration(course.estimated_duration)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        📖
                      {/* <BookOpen className="w-4 h-4" /> */}
                      <span>{course.department_display}</span>
                    </div>
                  </div>

                  {/* Progress Bar (if subscribed) */}
                  {course.is_subscribed && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Progression</span>
                        <span>{course.progress_percentage.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${course.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewCourse(course.id)}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      {course.is_subscribed ? 'Continuer' : 'Voir le cours'}
                    </button>
                    
                    {!course.is_subscribed && (
                      <button
                        onClick={() => handleSubscribe(course.id)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        title="S'inscrire"
                      >
                        👤
                        {/* <Users className="w-5 h-5" /> */}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseListWithFavorites;
