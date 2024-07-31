import React, { useState } from 'react';
import './Notifications.css';

const Notifications: React.FC = () => {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => {
    setOpen(!open);
  };

  return (
    <div className="notifications">
      <button className="notifications-icon" onClick={toggleMenu}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v2a4 4 0 0 1-8 0v-2"></path><rect x="2" y="7" width="20" height="13" rx="2" ry="2"></rect><path d="M7 7V4a4 4 0 0 1 8 0v3"></path></svg>
      </button>
      {open && (
        <div className="notifications-menu">
          <p>No new notifications</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
