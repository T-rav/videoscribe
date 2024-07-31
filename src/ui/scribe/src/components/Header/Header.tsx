import React from 'react';
import './Header.css';
import Notifications from '../Notifications/Notifications'; // Adjust the path if necessary

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="logo">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-id="4"><path d="m8 3 4 8 5-5 5 15H2L8 3z"></path></svg> 
        <span>&nbsp;Scribe AI</span>
      </div>
      <Notifications />
    </header>
  );
};

export default Header;
