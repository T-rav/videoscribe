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

    if (storedUser && storedAuthState === 'true' && token) {
      const isTokenExpired = checkTokenExpiration(token);

      if (isTokenExpired) {
        logout(() => navigate('/login')); // Redirect to login if the token is expired
      } else {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    }
  }, [navigate]);

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      const token = response.access_token;

      // Use secure flag based on environment
      Cookies.set('token', token, { expires: 1, secure: !isDev });

      // Fetch user profile info
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const profile = await res.json();

      const userProfile: UserProfile = {
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
      };

      setUser(userProfile);
      setIsAuthenticated(true);

      Cookies.set('user', JSON.stringify(userProfile), { expires: 1, secure: !isDev });
      Cookies.set('isAuthenticated', 'true', { expires: 1, secure: !isDev });
    },
    onError: () => {
      console.log('Login Failed');
    },
  });

  const logout = (redirect?: () => void) => {
    setIsAuthenticated(false);
    setUser(null);

    // Remove from cookies
    Cookies.remove('user');
    Cookies.remove('isAuthenticated');
    Cookies.remove('token');

    if (redirect) {
      redirect();
    } else {
      navigate('/login');
    }
  };

  const checkTokenExpiration = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      const currentTime = Math.floor(Date.now() / 1000);

      return exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Treat as expired if there's an error parsing
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
