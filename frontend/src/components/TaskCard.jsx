import React from 'react';

export default function TaskCard({ task, onEdit, onDelete }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (dateString, status) => {
    if (!dateString || status === 'done') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="task-card glass-panel" onClick={() => onEdit(task)}>
      <div className="card-header-group">
        <span className={`priority-tag ${task.priority}`}>
          {task.priority}
        </span>
      </div>
      
      <div className="task-title">{task.title}</div>
      
      {task.description && (
        <p className="task-desc">{task.description}</p>
      )}

      <div className="card-footer-group">
        <div 
          className="due-date-wrapper"
          style={{ color: isOverdue(task.dueDate, task.status) ? 'var(--priority-high)' : 'var(--text-muted)' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="due-date-icon">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>
            {formatDate(task.dueDate)}
            {isOverdue(task.dueDate, task.status) && ' (Overdue)'}
          </span>
        </div>

        <div className="card-actions-wrapper" onClick={stopPropagation}>
          <button 
            className="icon-btn edit" 
            title="Edit Task"
            onClick={() => onEdit(task)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          
          <button 
            className="icon-btn delete" 
            title="Delete Task"
            onClick={() => onDelete(task.id)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
