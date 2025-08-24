// api.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor to include access token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    
    // Debug logging
    console.log('🔗 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}/${config.url}`,
      hasToken: !!accessToken,
      tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'None'
    });
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      console.warn('⚠️ No access token found in localStorage');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      dataPreview: typeof response.data === 'object' ? 
        Object.keys(response.data).slice(0, 5) : 
        String(response.data).substring(0, 100)
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.log('🔄 Response interceptor - Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      hasRetryFlag: !!originalRequest._retry,
      errorMessage: error.message
    });
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        console.log('🔑 Attempting token refresh...', {
          hasRefreshToken: !!refreshToken,
          refreshTokenPreview: refreshToken ? refreshToken.substring(0, 20) + '...' : 'None'
        });
        
        if (refreshToken) {
          // Use the refresh token endpoint
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/token/refresh/`,
            { refresh: refreshToken },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          
          const newAccessToken = refreshResponse.data.access;
          localStorage.setItem('accessToken', newAccessToken);
          console.log('✅ Token refreshed successfully');
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          console.warn('⚠️ No refresh token available');
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Refresh token failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Show user-friendly message
        alert('Your session has expired. Please login again.');
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Add request/response timing
api.interceptors.request.use((config) => {
  (config as any).metadata = { startTime: new Date() };
  return config;
});


api.interceptors.response.use(
  (response) => {
    if ((response.config as any).metadata) {
      const duration = new Date().getTime() - (response.config as any).metadata.startTime.getTime();
      console.log(`⏱️ Request took ${duration}ms`);
    }
    return response;
  },
  (error) => {
    if ((error.config as any)?.metadata) {
      const duration = new Date().getTime() - (error.config as any).metadata.startTime.getTime();
      console.log(`⏱️ Failed request took ${duration}ms`);
    }
    return Promise.reject(error);
  }
);

export default api;