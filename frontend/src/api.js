// src/api.js

// Define the base URL for the backend API
// You can use an environment variable if available, otherwise default to localhost:3000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default API_BASE_URL;
