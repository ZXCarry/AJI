import React from 'react';

export default function Alerts({ type = 'info', message, onClose }) {
  if (!message) return null;

  const classMap = {
    success: 'alert-success',
    error: 'alert-danger',
    warning: 'alert-warning',
    info: 'alert-info',
  };

  const cls = classMap[type] || classMap.info;

  return (
    <div className={`alert ${cls} alert-dismissible fade show`} role="alert">
      {message}
      {onClose && (
        <button
          type="button"
          className="btn-close"
          aria-label="Close"
          onClick={onClose}
        />
      )}
    </div>
  );
}
