import React from 'react';
import './Header.css';
import Notifications from '../Notifications/Notifications';
import DropdownMenu from '../DropdownMenu/DropdownMenu';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="logo">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" data-id="4"><path d="m8 3 4 8 5-5 5 15H2L8 3z"></path></svg> 
        <span>&nbsp;Scribe AI</span>
      </div>
      <div className="header-right">
        <Notifications />
        <DropdownMenu />
      </div>
    </header>
  );
};

export default Header;
