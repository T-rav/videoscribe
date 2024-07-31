import React, { useState } from 'react';
import './DropdownMenu.css';

const DropdownMenu: React.FC = () => {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => {
    setOpen(!open);
  };

  return (
    <div className="dropdown">
      <button className="dropdown-toggle" onClick={toggleMenu}>
        Menu
      </button>
      {open && (
        <div className="dropdown-menu">
          <button className="sign-in">Sign in with Google</button>
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
