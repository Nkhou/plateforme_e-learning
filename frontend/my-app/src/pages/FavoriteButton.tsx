import React, { useState } from 'react';
// import { Heart } from 'lucide-react';
import api from '../api/api'; // Import your api instance
import { favoritesService } from './favoritesService';

interface FavoriteButtonProps {
  courseId: number;
  isFavorited: boolean;
  onToggle?: (isFavorited: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  courseId,
  isFavorited: initialIsFavorited,
  onToggle,
  size = 'md',
  className = '',
}) => {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isLoading, setIsLoading] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3',
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);
    try {
      // Use api instance for toggle
      const response = await api.post('favorites/toggle/', { 
        course_id: courseId 
      });
      
      setIsFavorited(response.data.is_favorited);
      
      // Call parent callback if provided
      if (onToggle) {
        onToggle(response.data.is_favorited);
      }

      // Optional: Show toast notification
      // toast.success(response.data.message);
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la mise à jour des favoris';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`
        ${buttonSizeClasses[size]}
        rounded-full transition-all duration-200
        ${isFavorited 
          ? 'bg-red-50 hover:bg-red-100 text-red-600' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-red-600'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      title={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      aria-label={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      ❤️
    </button>
  );
};

export default FavoriteButton;

// Alternative: Compact version for lists
export const FavoriteIconButton: React.FC<FavoriteButtonProps> = ({
  courseId,
  isFavorited: initialIsFavorited,
  onToggle,
  className = '',
}) => {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await favoritesService.toggleFavorite(courseId);
      setIsFavorited(response.is_favorited);
      
      if (onToggle) {
        onToggle(response.is_favorited);
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      alert(error.message || 'Erreur lors de la mise à jour des favoris');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={`
        inline-flex items-center justify-center
        transition-colors duration-200
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      title={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      ❤️
    </button>
  );
};

// Usage examples in comments:
/*
// In a course card:
<FavoriteButton
  courseId={course.id}
  isFavorited={course.is_favorited}
  onToggle={(isFavorited) => {
    console.log('Favorite status changed:', isFavorited);
    // Optionally refresh course list or update local state
  }}
  size="md"
/>

// In a course list (compact):
<FavoriteIconButton
  courseId={course.id}
  isFavorited={course.is_favorited}
  className="hover:scale-110"
/>
*/