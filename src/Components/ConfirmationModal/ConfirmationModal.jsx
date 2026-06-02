import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirmation-modal-overlay" role="presentation">
      <div
        className="confirmation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
      >
        <h3 id="confirmation-modal-title">{title || 'Notice'}</h3>
        <p>{message}</p>
        <div className="confirmation-modal-actions">
          {showCancel && (
            <button type="button" className="modal-cancel-btn" onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button type="button" className="modal-confirm-btn" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
