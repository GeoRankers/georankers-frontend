import React, { createContext, useContext, useState, useEffect } from "react";
import {
  login as loginAPI,
  register as registerAPI,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "@/apiHelpers";
import { setCurrentUserEmail, clearCurrentUserEmail } from "@/results/data/analyticsData";
import { setAnalysisUserEmail, clearAnalysisUserEmail } from "@/hooks/useAnalysisState";

/* =====================
   TYPES
   ===================== */
interface Product {
  id: string;
  name: string;
  description: string;
  website: string;
  business_domain: string;
  application_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface Application {
  id: string;
  user_id: string;
  company_name: string;
  project_token: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  products?: Product[];
}

interface ExtendedUser extends NonNullable<LoginResponse["user"]> {
  owned_applications?: { id: string; company_name: string; project_token: string }[];
}

interface AuthContextType {
  user: ExtendedUser | null;
  applicationId: string | null;
  applications: Application[];
  products: Product[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean | 'email_not_verified'>;
  register: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* =====================
   PROVIDER
   ===================== */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /* Restore state from localStorage on refresh */
  useEffect(() => {
    const storedAppId = localStorage.getItem("application_id");
    const storedToken = localStorage.getItem("access_token");
    const storedFirstName = localStorage.getItem("first_name");
    const storedApplications = localStorage.getItem("applications");
    const storedProducts = localStorage.getItem("products");
    
    if (storedAppId) {
      setApplicationId(storedAppId);
    }
    
    if (storedApplications) {
      setApplications(JSON.parse(storedApplications));
    }
    
    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    }
    
    // If we have a token, restore user state (user is logged in)
    if (storedToken) {
      setUser({ 
        id: "restored", 
        email: "user@restored.com", 
        first_name: storedFirstName || "User", 
        last_name: "User" 
      });
    }
  }, []);

  /* =====================
     LOGIN
     ===================== */
  const login = async (email: string, password: string): Promise<boolean | 'email_not_verified'> => {
    setIsLoading(true);
    try {
      console.log('Auth context: Attempting login for:', email);
      const res = await loginAPI({ email, password });

      console.log('Auth context: Login response received', res);

      // Check if email is not verified
      if (!res.access_token || res.access_token.trim() === "") {
        console.log('Auth context: No access token - email not verified');
        return 'email_not_verified';
      }

      // We have a valid response with access_token
      if (res.user) {
        const extendedUser = res.user as ExtendedUser;
        setUser(extendedUser);

        console.log('Auth context: User set:', extendedUser);

        // Set user email for analytics data mapping and analysis state scoping
        setCurrentUserEmail(email);
        setAnalysisUserEmail(email);

        // Save first name to localStorage
        localStorage.setItem("first_name", extendedUser.first_name);

        // Store applications and products from response
        const appsFromResponse = (res as any).applications || [];
        setApplications(appsFromResponse);
        localStorage.setItem("applications", JSON.stringify(appsFromResponse));

        console.log('Auth context: Applications:', appsFromResponse);

        // Extract products from applications
        const allProducts: Product[] = [];
        appsFromResponse.forEach((app: Application) => {
          if (app.products && app.products.length > 0) {
            allProducts.push(...app.products);
          }
        });
        setProducts(allProducts);
        localStorage.setItem("products", JSON.stringify(allProducts));

        console.log('Auth context: Products:', allProducts);

        // Pick applicationId from response
        let appId: string | null = null;
        if (extendedUser.owned_applications?.length) {
          appId = extendedUser.owned_applications[0].id;
        } else if ((res as any).application?.id) {
          appId = (res as any).application.id;
        } else if (appsFromResponse.length > 0) {
          appId = appsFromResponse[0].id;
        }

        if (appId) {
          setApplicationId(appId);
          console.log('Auth context: Application ID set:', appId);
        }

        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Auth context: Login error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /* =====================
     REGISTER (auto-login after success)
     ===================== */
  const register = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    setIsLoading(true);
    try {
      // Split full name on first space
      const parts = fullName.trim().split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ') || ' ';

      const payload: RegisterRequest = {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        app_name: "My App",
      };

      const response: RegisterResponse = await registerAPI(payload);

      if (response.application?.id) {
        setApplicationId(response.application.id);
        localStorage.setItem("application_id", response.application.id);
      }

      // Save first name to localStorage
      localStorage.setItem("first_name", firstName);
      
      console.log("Registration completed successfully");
    } finally {
      setIsLoading(false);
    }
  };

  /* =====================
     LOGOUT - Clear session data but preserve analytics
     ===================== */
  const logout = () => {
    // NOTE: Do NOT clear analysis state on logout - it should persist per email
    // The analysis state is email-scoped in sessionStorage and should remain
    // so when the user logs back in, they see their analysis is still running
    
    // Clear user email references (but keep email-scoped data)
    clearAnalysisUserEmail();
    clearCurrentUserEmail();
    
    // Clear only session-related items, NOT analytics data or analysis state
    const sessionItems = [
      'access_token',
      'refresh_token',
      'application_id',
      'applications',
      'products',
      'first_name',
      'product_id',
      // Note: 'user_email' is kept in localStorage to help restore state on login
    ];
    
    sessionItems.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    });
    
    // Do NOT clear sessionStorage - analysis state is stored there per email
    // sessionStorage.clear(); // REMOVED - this was wiping analysis state
    
    // Reset state
    setUser(null);
    setApplicationId(null);
    setApplications([]);
    setProducts([]);
  };

  return (
    <AuthContext.Provider
      value={{ user, applicationId, applications, products, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* =====================
   HOOK
   ===================== */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
