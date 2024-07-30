import React from 'react';
import './App.css';
import Header from './components/Header/Header';
import Form from './components/Form/Form';

const App: React.FC = () => {
  return (
    <div className="App">
      <Header />
      {/* <div>
     Transcribe YouTube Videos Effortlessly
     Our SaaS platform makes it easy to convert your YouTube videos into text-based transcripts, captions, and subtitles.
     </div> */}
      <Form />
    </div>
  );
}

export default App;
