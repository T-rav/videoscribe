import React from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  datetime: string;
  length: string;
  progress: string;
  content: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, datetime, length, progress, content }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p><strong>Datetime:</strong> {datetime}</p>
        <p><strong>Length:</strong> {length}</p>
        <p><strong>Progress:</strong> {progress}</p>
        <div className="modal-body">
          <p>{content}</p>
        </div>
        <button className="close-button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Modal;
