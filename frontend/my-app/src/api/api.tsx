import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/',
    withCredentials: true,  // This sends cookies automatically
});

// Remove the token interceptor entirely since you're using cookies
export default api;