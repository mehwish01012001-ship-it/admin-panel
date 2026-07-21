import React from 'react';
import './ImagePreviewModal.css';

const ImagePreviewModal = ({ open, imageUrl, onClose }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="image-modal" onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="Preview" />
        <button className="btn-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
