// api.tsx
export const BASE_URL = import.meta.env.VITE_BASE_URL;

export const API_ENDPOINTS = {
  // Auth
  login: `${BASE_URL}/api/v1/users/login`,
  register: `${BASE_URL}/api/v1/users/register-with-app`,
  forgotPassword: `${BASE_URL}/api/v1/users/forgot-password`,
  resetPassword: `${BASE_URL}/api/v1/users/reset-password`,
  verifyEmail: `${BASE_URL}/api/v1/users/verify-email`,

  // Products
  createProductWithKeywords: `${BASE_URL}/api/v1/products/with-keywords`,
  generateWithKeywords: `${BASE_URL}/api/v1/products/generate/with-keywords`,
  regenerateAnalysis: `${BASE_URL}/api/v1/products/generate/result-and-analytics`,

  // Analytics
  getKeywordAnalytics: (keywordId: string, date: string) =>
    `${BASE_URL}/api/v1/analytics/keywords/${keywordId}?date=${date}`,

  getProductAnalytics: (productId: string) =>
    `${BASE_URL}/api/v1/products/analytics/${productId}`,

  // Product by Application ID
  getProductsByApplication: (applicationId: string) =>
    `${BASE_URL}/api/v1/products/application/${applicationId}`,

  // Chatbot endpoints
  getChatHistory: (productId: string, limit: number = 100) =>
    `${BASE_URL}/api/v1/products/chatbot/history/${productId}?limit=${limit}`,
  sendChatMessage: (productId: string) =>
    `${BASE_URL}/api/v1/products/chatbot/${productId}`,

  // Dashboard
  dashboardUsers: `${BASE_URL}/api/v1/dashboard/users`,

  getProductSearchResults: (productId: string) =>
    `${BASE_URL}/api/v1/products/search/${productId}`,
};
