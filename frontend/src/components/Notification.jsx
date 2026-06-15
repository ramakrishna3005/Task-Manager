import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';

export default function Notification() {
  const { toasts, removeToast } = useWebSocket();

  if (toasts.length === 0) return null;

  return (
    <div className="toasts-container">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`toast ${toast.removing ? 'removing' : ''}`}
          style={{
            borderColor: 
              toast.type === 'TASK_CREATED' ? 'var(--status-todo)' :
              toast.type === 'TASK_UPDATED' ? 'var(--status-inprogress)' :
              'var(--priority-high)'
          }}
        >
          <div className="toast-header-group">
            <span className="toast-tag" style={{
              color: 
                toast.type === 'TASK_CREATED' ? 'var(--status-todo)' :
                toast.type === 'TASK_UPDATED' ? 'var(--status-inprogress)' :
                'var(--priority-high)'
            }}>
              {toast.type.replace('_', ' ')}
            </span>
            <button className="toast-close-btn" onClick={() => removeToast(toast.id)}>
              &times;
            </button>
          </div>
          <div className="toast-body">
            <strong>{toast.sender}</strong> {toast.message}
          </div>
          <div className="toast-time">
            {new Date(toast.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      ))}
    </div>
  );
}
