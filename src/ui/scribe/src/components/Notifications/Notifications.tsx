import React, { useState, useEffect, useRef } from 'react';
import './Notifications.css';
import Modal from '../Modal/Modal'; // Adjust the path if necessary
import { useNotificationContext } from '../NotificationContext';

const Notifications: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const { notifications, removeNotification } = useNotificationContext();
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setOpen(!open);
  };

  const openModal = (notification: any) => {
    setCurrentNotification(notification);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentNotification(null);
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
    <div className="notifications" ref={menuRef}>
      <button className="notifications-icon" onClick={toggleMenu}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v2a4 4 0 0 1-8 0v-2"></path><rect x="2" y="7" width="20" height="13" rx="2" ry="2"></rect><path d="M7 7V4a4 4 0 0 1 8 0v3"></path></svg>
        {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
      </button>
      {open && (
        <div className="notifications-menu">
          {notifications.length === 0 ? (
            <div className="no-notifications">No notifications</div>
          ) : (
            notifications.map((notification, index) => (
              <div key={index} className="notification-item">
                <h4>{notification.title}</h4>
                <p><strong>Datetime:</strong> {notification.datetime}</p>
                <p><strong>Length:</strong> {notification.length}</p>
                <button className="view-button" onClick={() => openModal(notification)}>View Details</button>
                <button className="close-button" onClick={() => removeNotification(index)}>x</button>
              </div>
            ))
          )}
        </div>
      )}
      {currentNotification && (
        <Modal
          isOpen={modalOpen}
          onClose={closeModal}
          title={currentNotification.title}
          content={currentNotification.transcript}
        />
      )}
    </div>
  );
};

export default Notifications;
