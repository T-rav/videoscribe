import React from 'react';
import './App.css';
import Header from './components/Header/Header';
import Form from './components/Form/Form';
import Footer from './components/Footer/Footer';

const App: React.FC = () => {
  return (
    <div className="App">
      <Header />
      <div className="main-content">
        <Form />
      </div>
      <Footer />
    </div>
  );
}

export default App;
