import React from 'react';
import './App.css';
import Header from './components/Header/Header';
import Form from './components/Form/Form';

const App: React.FC = () => {
  return (
    <div className="App">
      <Header />
      <Form />
    </div>
  );
}

export default App;
