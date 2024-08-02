import React from 'react';
import './App.css';
import Header from './components/Header/Header';
import Form from './components/Form/Form';
import Footer from './components/Footer/Footer';
import Notifications from './components/Notifications/Notifications';
import { NotificationProvider } from './components/NotificationContext';

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <div className="App">
        <Header />
        <Notifications />
        <Form />
        <Footer />
      </div>
    </NotificationProvider>
  );
}

export default App;
