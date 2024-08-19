import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
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
  login: () => void;
  logout: (redirect?: () => void) => void;
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
  const navigate = useNavigate();

  const isDev = process.env.NODE_ENV === 'development';

  // Initialize authentication state from cookies
  useEffect(() => {
    const storedUser = Cookies.get('user');
    const storedAuthState = Cookies.get('isAuthenticated');
    const token = Cookies.get('token');

    console.log("AuthContext: Initializing authentication state from cookies");
    console.log("storedUser:", storedUser);
    console.log("storedAuthState:", storedAuthState);
    console.log("token:", token);

    if (storedUser && storedAuthState === 'true' && token) {
      const isTokenExpired = checkTokenExpiration(token);

      if (isTokenExpired) {
        console.log("AuthContext: Token is expired, logging out");
        logout(() => navigate('/login')); // Redirect to login if the token is expired
      } else {
        console.log("AuthContext: Token is valid, setting user state");
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    }
  }, [navigate]);

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

  const checkTokenExpiration = (token: string): boolean => {
    try {
      console.log("AuthContext: Checking token expiration");
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      const currentTime = Math.floor(Date.now() / 1000);

      console.log("AuthContext: Token expiration time:", exp);
      console.log("AuthContext: Current time:", currentTime);

      return exp < currentTime;
    } catch (error) {
      console.error('AuthContext: Error checking token expiration:', error);
      return true; // Treat as expired if there's an error parsing
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
