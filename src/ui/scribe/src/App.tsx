import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header/Header';
import LandingPageForm from './components/LandingPageForm/LandingPageForm';
import Footer from './components/Footer/Footer';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import { NotificationProvider } from './components/NotificationContext';

const App: React.FC = () => {
  const isAuthenticated = () => {
    // Mock authentication check, replace with real logic
    return true;
  };

  return (
    <NotificationProvider>
        <Header />
        <div className="main-content">
          <Routes>
            {/* Root route redirection based on authentication */}
            {/* <Route path="/" element={isAuthenticated() ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} /> */}

            {/* Login route */}
            <Route path="/login" element={<Login />} />

            {/* Dashboard route */}
            <Route path="/dashboard" element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />} />

            {/* Landing Page route */}
            <Route path="/" element={<LandingPageForm />} />
          </Routes>
        </div>
        <Footer />
    </NotificationProvider>
  );
};

export default App;
