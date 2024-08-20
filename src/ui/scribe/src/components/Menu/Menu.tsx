import React, { useState, useEffect, useRef } from 'react';
import './Menu.css';
import Modal from '../Modal/Modal';
import { useNotificationContext } from '../NotificationContext';
import { useAuth } from '../AuthContext'; // Import the useAuth hook

const Menu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const { notifications, removeNotification } = useNotificationContext();
  const { isAuthenticated, user, login, logout } = useAuth();
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
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7" r="4"></circle>
          <path d="M5.2 18.2C6.2 15.3 8.8 13 12 13s5.8 2.3 6.8 5.2"></path>
        </svg>
        {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
      </button>
      {open && (
        <div className="notifications-menu">
          <div className="notifications-list">
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

          {/* Show login/logout based on authentication state */}
          {!isAuthenticated ? (
            <button className="sign-in" onClick={() => login()}>Sign in with Google</button>
          ) : (
            <div className="user-info">
              <img src={user?.picture} alt={user?.name} className="user-avatar" />
              <span className="user-name">{user?.name}</span>
              <button className="sign-out" onClick={() => logout()}>Sign out</button>
            </div>
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

export default Menu;
