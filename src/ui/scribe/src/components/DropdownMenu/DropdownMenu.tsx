import React, { useState, useEffect, useRef } from 'react';
import './DropdownMenu.css';

const DropdownMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setOpen(!open);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="dropdown" ref={menuRef}>
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
