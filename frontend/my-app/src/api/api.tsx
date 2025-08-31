// api.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  // headers: {
  //   'Content-Type': 'application/json',
  // },
  withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        // Only set Content-Type for non-FormData requests
        if (!(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
        }
        // For FormData requests, axios will automatically set:
        // Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Optional: Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);
// Add request interceptor to include access token
// api.interceptors.request.use(
//   (config) => {
//     const accessToken = localStorage.getItem('accessToken');
    
//     console.log('🔗 API Request:', {
//       method: config.method?.toUpperCase(),
//       url: config.url,
//       hasToken: !!accessToken,
//     });
    
//     if (accessToken) {
//       config.headers.Authorization = `Bearer ${accessToken}`;
//     } else {
//       console.warn('⚠️ No access token found in localStorage');
//     }
    
//     return config;
//   },
//   (error) => {
//     console.error('❌ Request interceptor error:', error);
//     return Promise.reject(error);
//   }
// );

// // Add response interceptor to handle token refresh
// api.interceptors.response.use(
//   (response) => {
//     console.log('✅ API Response:', {
//       status: response.status,
//       url: response.config.url,
//     });
//     return response;
//   },
//   async (error) => {
//     const originalRequest = error.config;
    
//     console.log('🔄 Response interceptor - Error details:', {
//       status: error.response?.status,
//       url: error.config?.url,
//     });
    
//     // Check if it's a 401 error and we haven't retried yet
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
      
//       try {
//         const refreshToken = localStorage.getItem('refreshToken');
//         console.log('🔑 Attempting token refresh...', {
//           hasRefreshToken: !!refreshToken,
//         });
        
//         if (refreshToken) {
//           // FIXED: Use the correct refresh endpoint
//           const refreshResponse = await axios.post(
//             `${API_BASE_URL}/token/refresh/`, // This should match your Django URLs
//             { refresh: refreshToken },
//             {
//               headers: {
//                 'Content-Type': 'application/json'
//               }
//             }
//           );
          
//           const newAccessToken = refreshResponse.data.access;
//           localStorage.setItem('accessToken', newAccessToken);
//           console.log('✅ Token refreshed successfully');
          
//           // Retry the original request with new token
//           originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//           return api(originalRequest);
//         } else {
//           console.warn('⚠️ No refresh token available');
//           // Clear tokens and redirect to login
//           localStorage.removeItem('accessToken');
//           localStorage.removeItem('refreshToken');
//           window.location.href = '/';
//         }
//       } catch (refreshError) {
//         console.error('❌ Token refresh failed:', refreshError);
        
//         // Clear tokens and redirect to login
//         localStorage.removeItem('accessToken');
//         localStorage.removeItem('refreshToken');
        
//         alert('Your session has expired. Please login again.');
//         window.location.href = '/';
        
//         return Promise.reject(refreshError);
//       }
//     }
    
//     return Promise.reject(error);
//   }
// );

export default api;