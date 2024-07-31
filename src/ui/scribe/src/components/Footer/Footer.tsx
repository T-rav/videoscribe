import React from 'react';
import './Footer.css';
import DropdownMenu from '../DropdownMenu/DropdownMenu'; // Adjust the path if necessary

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-left">
        <DropdownMenu />
      </div>
      <div className="footer-content">
        <p>© 2024 Scribe AI - Transcribe YouTube Videos Effortlessly</p>
      </div>
    </footer>
  );
};

export default Footer;
