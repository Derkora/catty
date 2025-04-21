// Centralized configuration file for environment variables
// Uses a fallback mechanism to support different frameworks and handle when env vars aren't available

// API Token for Strapi authentication
export const API_TOKEN = 
  // Check for Create React App style env vars
  (typeof window !== 'undefined' && window.__ENV && window.__ENV.REACT_APP_API_TOKEN) ||
  // Fallback to hardcoded value if not set
  "9547c5c312fd7b1307cbb2c61b77378890b8bdb9fc3240cbd673e5765fcf0982d4a08e856569236026a32a593260244d6008960605b76214085249fb4e8d0f17862baeea6b4b87c6840fb2a128223dfdb85b34719d4664e054d0dbaecc4985249f9d092769dc508a50d9cf96797a4997be4c7b713b93ac79a0b45b981bd29f89";

// Base URL for API endpoints
export const API_BASE_URL = 
  // Check for Create React App style env vars
  (typeof window !== 'undefined' && window.__ENV && window.__ENV.REACT_APP_API_BASE_URL) ||
  // Fallback to default value
  "http://localhost:3000";

// Interface to make TypeScript aware of our injected variables
declare global {
  interface Window {
    __ENV?: {
      [key: string]: string;
    };
  }
} 