import React from 'react';
import './App.css';
import Header from './components/Header/Header';
import Form from './components/Form/Form';
import Footer from './components/Footer/Footer';
import { NotificationProvider } from './components/NotificationContext';

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <div className="App">
        <Header />
        <div className="content">
          <Form />
        </div>
        <Footer />
      </div>
    </NotificationProvider>
  );
}

export default App;
