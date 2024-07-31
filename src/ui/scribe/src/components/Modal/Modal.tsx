import React from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content).then(() => {
      alert('Transcript copied to clipboard!');
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{title}</h2>
        <button className="copy-button" onClick={copyToClipboard}>Copy Transcript</button>
        <p>{content}</p>
      </div>
    </div>
  );
};

export default Modal;
