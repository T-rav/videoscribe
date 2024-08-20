import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header/Header';
import LandingPageForm from './components/LandingPageForm/LandingPageForm';
import Footer from './components/Footer/Footer';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import { NotificationProvider } from './components/NotificationContext';
import { useAuth } from './components/AuthContext';
import Spinner from './components/Spinner/Spinner';

const App: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Spinner />; 
  }

  return (
    <NotificationProvider>
      <Header />
      <div className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/" element={<LandingPageForm />} />
        </Routes>
      </div>
      <Footer />
    </NotificationProvider>
  );
};

export default App;
