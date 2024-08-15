import React from 'react';
import './App.css';
import Header from './components/Header/Header';
import LandingPageForm from './components/LandingPageForm/LandingPageForm';
import Footer from './components/Footer/Footer';
import { NotificationProvider } from './components/NotificationContext';

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <div className="App">
        <Header />
        <div className="main-content">
          <LandingPageForm />
        </div>
        <Footer />
      </div>
    </NotificationProvider>
  );
}

export default App;
