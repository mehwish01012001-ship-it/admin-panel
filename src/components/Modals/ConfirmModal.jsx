import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ open, onClose, onConfirm, title, message }) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
