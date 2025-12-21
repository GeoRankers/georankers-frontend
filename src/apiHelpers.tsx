// src/apiHelpers.tsx
import axios, { AxiosResponse } from "axios";
import { API_ENDPOINTS } from "./api";
import { handleUnauthorized, isUnauthorizedError } from "./lib/authGuard";

/* =====================
   TYPES
   ===================== */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    owned_applications?: { id: string; company_name: string; project_token: string }[];
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  app_name: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  application: {
    id: string;
    user_id: string;
    company_name: string;
    project_token: string;
  };
  access_token: string;
  refresh_token: string;
}

export interface ProductPayload {
  name: string;
  description: string;
  website: string;
  business_domain: string;
  application_id: string;
  search_keywords: string[];
}

export interface NewAnalysis {
  productId: string,
  searchKeywords: string[]
}

/* =====================
   AXIOS CONFIG
   ===================== */
const API = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

// Request interceptor - add auth token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.headers) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

// Response interceptor - handle 401 unauthorized errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Skip auth check for login/register/verify endpoints
    const authEndpoints = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
    const requestUrl = error.config?.url || '';
    const isAuthEndpoint = authEndpoints.some(endpoint => requestUrl.includes(endpoint));
    
    if (!isAuthEndpoint && isUnauthorizedError(error)) {
      console.log("🔒 [API] Unauthorized error detected - logging out user");
      handleUnauthorized();
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

/* =====================
   AUTH HELPERS
   ===================== */
export const login = async (payload: LoginRequest): Promise<LoginResponse> => {
  console.log('Login API called with email:', payload.email);
  const res: AxiosResponse<LoginResponse> = await API.post(API_ENDPOINTS.login, payload);
  console.log('Login API response:', res.data);

  // Save the access token if present
  if (res.data.access_token && res.data.access_token.trim() !== "") {
    localStorage.setItem("access_token", res.data.access_token);
    console.log('Access token saved');

    const appId = res.data.user?.owned_applications?.[0]?.id;
    if (appId) {
      localStorage.setItem("application_id", appId);
      console.log('Application ID saved:', appId);
    }
  } else {
    console.log('No access token in response - email verification may be pending');
  }

  return res.data;
};

export const register = async (
  payload: RegisterRequest
): Promise<RegisterResponse | null> => {
  try {
    const res: AxiosResponse<RegisterResponse> = await API.post(
      API_ENDPOINTS.register,
      payload
    );

    // Store tokens if registration successful
    if (res.data.access_token) {
      localStorage.setItem("access_token", res.data.access_token);
    }
    if (res.data.application?.id) {
      localStorage.setItem("application_id", res.data.application.id);
    }

    return res.data;
  } catch (error: any) {
    console.error("Register error:", error);

    // Extract message from backend
    const backendMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Registration failed. Please try again.";

    // Throw clean error message (no toast here)
    throw new Error(backendMessage);
  }
};

/* =====================
   FORGOT PASSWORD & RESET
   ===================== */
export const forgotPassword = async (email: string): Promise<any> => {
  try {
    const res = await API.post(API_ENDPOINTS.forgotPassword, { email });
    return res.data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

export const resetPassword = async (token: string, newPassword: string): Promise<any> => {
  try {
    const res = await API.post(API_ENDPOINTS.resetPassword, { 
      token, 
      new_password: newPassword 
    });
    return res.data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

export const verifyEmail = async (token: string): Promise<any> => {
  try {
    console.log('Verify email API called with token:', token);
    const res = await API.get(`${API_ENDPOINTS.verifyEmail}?token=${token}`);
    console.log('Verify email API response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Verify email error:', error);
    throw error;
  }
};

/* =====================
   PRODUCT HELPERS
   ===================== */
export const createProductWithKeywords = async (payload: ProductPayload): Promise<any> => {
  try {
    const appId = payload.application_id || localStorage.getItem("application_id") || "";

    let body;
    if ((payload as any).brand) {
      const brandTrimmed = (payload as any).brand.trim();
      body = {
        name: brandTrimmed,
        description: brandTrimmed,
        website: brandTrimmed,
        business_domain: brandTrimmed,
        application_id: appId,
        search_keywords: (payload as any).search_keywords?.filter((k: string) => k.trim() !== "") || [],
      };
    } else {
      body = {
        name: payload.name,
        description: payload.description,
        website: payload.website,
        business_domain: payload.business_domain,
        application_id: appId,
        search_keywords: (payload.search_keywords || []).filter((k) => k.trim() !== ""),
      };
    }

    const res = await API.post(API_ENDPOINTS.createProductWithKeywords, body);
    return res.data;
  } catch (error) {
    return null;
  }
};

export const fetchProductsWithKeywords = async (payload: ProductPayload): Promise<any> => {
  try {
    const res = await API.post(API_ENDPOINTS.createProductWithKeywords, payload);
    return res.data;
  } catch (error) {
    return null;
  }
};

export const generateWithKeywords = async (
  productId: string,
  searchKeywords: string[]
): Promise<any> => {
  try {
    const body = {
      product_id: productId,
      search_keywords: searchKeywords,
    };
    const res = await API.post(API_ENDPOINTS.generateWithKeywords, body);
    return res.data;
  } catch (error) {
    return null;
  }
};

/* =====================
   ANALYTICS HELPERS
   ===================== */
export const getProductAnalytics = async (
  productId: string,
  accessToken: string
): Promise<any> => {
  try {
    const res = await API.get(API_ENDPOINTS.getProductAnalytics(productId), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res?.data || null;
  } catch (error) {
    return null;
  }
};

export const regenerateAnalysis = async (
  productId: string,
  accessToken: string
): Promise<any> => {
  try {
    const res = await API.post(
      API_ENDPOINTS.regenerateAnalysis, 
      { product_id: productId },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return res?.data || null;
  } catch (error) {
    console.error('Regenerate analysis error:', error);
    return null;
  }
};

export const getKeywordAnalytics = async (
  keywordId: string,
  date: string,
  accessToken: string
): Promise<any> => {
  try {
    const res = await API.get(API_ENDPOINTS.getKeywordAnalytics(keywordId, date), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res?.data || null;
  } catch (error) {
    return null;
  }
};

export const getProductsByApplication = async (
  applicationId: string,
  accessToken: string
): Promise<any> => {
  try {
    const res = await API.get(API_ENDPOINTS.getProductsByApplication(applicationId), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res?.data || null;
  } catch (error) {
    return null;
  }
};

/* =====================
   CHAT HELPERS
   ===================== */
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface ChatbotRequest {
  product_id: string;
  question: string;
}

export interface ChatbotResponse {
  answer: string;
  suggested_questions: string[];
  product_id: string;
  question: string;
  timestamp: string;
}

export interface ChatHistory {
  id: string;
  product_id: string;
  user_id: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

export interface ChatHistoryResponse {
  product_id: string;
  history: ChatHistory[];
  count: number;
  limit: number;
}

export const getChatHistory = async (
  productId: string,
  accessToken: string,
  limit: number = 100
): Promise<ChatMessage[]> => {
  try {
    const res = await API.get(API_ENDPOINTS.getChatHistory(productId, limit), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    const data: ChatHistoryResponse = res?.data;
    
    if (!data || !data.history || !Array.isArray(data.history)) {
      return [];
    }
    
    // Transform history to messages array
    const messages: ChatMessage[] = [];
    
    // History comes most recent first, reverse for chronological display
    const reversedHistory = [...data.history].reverse();
    
    reversedHistory.forEach((item) => {
      // Add user message (question)
      messages.push({
        id: `${item.id}-question`,
        content: item.question,
        role: 'user',
        timestamp: item.created_at || item.updated_at,
      });
      
      // Add assistant message (answer)
      messages.push({
        id: `${item.id}-answer`,
        content: item.answer,
        role: 'assistant',
        timestamp: item.updated_at || item.created_at,
      });
    });
    
    return messages;
  } catch (error) {
    console.error('Failed to get chat history:', error);
    return [];
  }
};

export const sendChatMessage = async (
  question: string,
  productId: string,
  accessToken: string
): Promise<ChatbotResponse | null> => {
  try {
    const requestBody: ChatbotRequest = {
      product_id: productId,
      question: question,
    };
    
    const res = await API.post(
      API_ENDPOINTS.sendChatMessage(productId),
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    return res?.data || null;
  } catch (error) {
    console.error('Failed to send chat message:', error);
    return null;
  }
};

/* =====================
   DASHBOARD HELPERS
   ===================== */
export interface DashboardUser {
  id: string;
  user_id: string;
  email: string;
  name: string;
  product_website: string;
  keywords_list: string[];
  results_generated?: boolean;
  analytics_generated?: boolean;
  created_at: string;
  updated_at: string;
}

export const getDashboardUsers = async (
  accessToken?: string
): Promise<DashboardUser[]> => {
  try {
    const headers: any = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    
    const res = await API.get(API_ENDPOINTS.dashboardUsers, {
      headers,
    });
    return res?.data || [];
  } catch (error: any) {
    console.error('Failed to get dashboard users:', error);
    
    // Extract error message from backend response
    const errorMessage = 
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Failed to fetch dashboard users';
    
    // Throw error with backend message so it can be handled by the component
    throw new Error(errorMessage);
  }
};

/* =====================
   SEARCH RESULTS TYPES
===================== */

export interface SearchResult {
  name: string;
  rank: number;
  sources: string[];
  description: string;
  additional_fields?: Record<string, any>;
}

export interface QueryResult {
  id: string;
  query: string;
  created_at: string;
  updated_at: string;
  result: {
    gemini?: SearchResult[];
    openai?: SearchResult[];
  };
}

export interface KeywordData {
  keyword_id: string;
  keyword: string;
  results: QueryResult[];
}

export interface SearchResultsResponse {
  product_id: string;
  keyword_count: number;
  total_results: number;
  limit: number;
  keywords: KeywordData[];
}

// Auth interceptor
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["Content-Type"] = "application/json";
  return config;
});

/* =====================
   HELPER
===================== */

export const getProductSearchResults = async (
  productId: string
): Promise<SearchResultsResponse> => {
  try {
    const res = await API.get(
      API_ENDPOINTS.getProductSearchResults(productId)
    );
    return res.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch search results";
    throw new Error(message);
  }
};
