import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean; // Add loading state
  login: () => void;
  logout: (redirect?: () => void) => void;
  verifyAuth: () => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Initialize loading as true
  const navigate = useNavigate();

  // Check authentication status on initialization
  useEffect(() => {
    verifyAuth();
  }, []);

  const verifyAuth = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/verify`, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error verifying auth:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false); // Set loading to false after verification
    }
  };

  const login = () => {
    console.log("AuthContext: Initiating Google OAuth login");
    window.location.href = `${process.env.REACT_APP_API_BASE_URL}/auth/google`; // Redirect to the backend's Google OAuth route
  };

  const logout = (redirect?: () => void) => {
    console.log("AuthContext: Logging out");
    setIsAuthenticated(false);
    setUser(null);

    // Remove from cookies
    Cookies.remove('user');
    Cookies.remove('isAuthenticated');
    Cookies.remove('token');

    if (redirect) {
      console.log("AuthContext: Redirecting after logout");
      redirect();
    } else {
      console.log("AuthContext: Navigating to /login after logout");
      navigate('/login'); // Redirect to login page on logout
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout, verifyAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
