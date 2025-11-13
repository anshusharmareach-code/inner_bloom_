import React from 'react';
import '../CSS/Modal.css';

const Modal = ({ message, onClose, onLogin }) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <p className="modal-message">{message}</p>
        {(message.includes("log in") || message.includes("login")) && (
            <button className="login-button" onClick={onLogin}>
                Log In Now
            </button>
        )}
      </div>
    </div>
  );
};

export default Modal;