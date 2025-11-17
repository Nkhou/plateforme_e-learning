// src/services/favoritesService.ts
import api from '../api/api'; // Import your api instance instead of axios

// Types
export interface FavoriteCourse {
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

export interface FavoritesResponse {
  count: number;
  results: FavoriteCourse[];
}

export interface ToggleFavoriteResponse {
  message: string;
  is_favorited: boolean;
  favorite?: FavoriteCourse;
}

// API Service using your api instance
export const favoritesService = {
  // Get all favorites for the authenticated user
  async getFavorites(): Promise<FavoriteCourse[]> {
    try {
      const response = await api.get<FavoritesResponse>('favorites/');
      return response.data.results || response.data;
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch favorites');
    }
  },

  // Add a course to favorites
  async addFavorite(courseId: number): Promise<FavoriteCourse> {
    try {
      const response = await api.post<FavoriteCourse>(
        'favorites/',
        { course: courseId }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error adding favorite:', error);
      throw new Error(error.response?.data?.message || 'Failed to add favorite');
    }
  },

  // Remove a favorite by favorite ID
  async removeFavorite(favoriteId: number): Promise<void> {
    try {
      await api.delete(`favorites/${favoriteId}/`);
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove favorite');
    }
  },

  // Toggle favorite status
  async toggleFavorite(courseId: number): Promise<ToggleFavoriteResponse> {
    try {
      const response = await api.post<ToggleFavoriteResponse>(
        'favorites/toggle/',
        { course_id: courseId }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      throw new Error(error.response?.data?.message || 'Failed to toggle favorite');
    }
  },

  // Remove favorite by course ID
  async removeFavoriteByCourse(courseId: number): Promise<void> {
    try {
      await api.delete(`favorites/remove-by-course/${courseId}/`);
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove favorite');
    }
  },

  // Check if a course is favorited
  async isFavorited(courseId: number, favorites: FavoriteCourse[]): Promise<boolean> {
    return favorites.some(fav => fav.course_id === courseId);
  },
};

export default favoritesService;