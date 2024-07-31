import React, { useState } from 'react';
import './Notifications.css';
import Modal from '../Modal/Modal'; // Adjust the path if necessary

const Notifications: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const toggleMenu = () => {
    setOpen(!open);
  };

  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <div className="notifications">
      <button className="notifications-icon" onClick={toggleMenu}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v2a4 4 0 0 1-8 0v-2"></path><rect x="2" y="7" width="20" height="13" rx="2" ry="2"></rect><path d="M7 7V4a4 4 0 0 1 8 0v3"></path></svg>
      </button>
      {open && (
        <div className="notifications-menu">
          <div className="notification-item">
            <h4>Sample Video Title</h4>
            <p><strong>Datetime:</strong> 2024-07-30 14:30</p>
            <p><strong>Length:</strong> 10:30</p>
            <p><strong>Progress:</strong> 50%</p>
            <button className="view-button" onClick={openModal}>View Details</button>
          </div>
        </div>
      )}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Sample Video Title"
        datetime="2024-07-30 14:30"
        length="10:30"
        progress="50%"
        content="Here is the detailed content of the video transcription progress..."
      />
    </div>
  );
};

export default Notifications;
