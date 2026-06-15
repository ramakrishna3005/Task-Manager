import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { api } from '../services/api';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';

const COLUMNS = [
  { id: 'todo', title: 'To Do', className: 'todo' },
  { id: 'in_progress', title: 'In Progress', className: 'inprogress' },
  { id: 'review', title: 'Under Review', className: 'review' },
  { id: 'done', title: 'Done', className: 'done' }
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { isConnected, registerListener, unregisterListener } = useWebSocket();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null); // null means create mode, object means edit mode

  // Fetch initial tasks
  useEffect(() => {
    async function fetchTasks() {
      try {
        const data = await api.getTasks();
        setTasks(data);
      } catch (err) {
        console.error('Error fetching tasks', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  // Listen for WebSocket updates
  useEffect(() => {
    const handleWsMessage = (message) => {
      if (message.type === 'TASK_CREATED') {
        setTasks(prev => {
          // Prevent duplicate if this client created it (already added via API callback)
          if (prev.some(t => t.id === message.task.id)) return prev;
          return [...prev, message.task];
        });
      } else if (message.type === 'TASK_UPDATED') {
        setTasks(prev => prev.map(t => t.id === message.task.id ? message.task : t));
      } else if (message.type === 'TASK_DELETED') {
        setTasks(prev => prev.filter(t => t.id !== message.taskId));
      }
    };

    registerListener(handleWsMessage);
    return () => {
      unregisterListener(handleWsMessage);
    };
  }, [registerListener, unregisterListener]);

  const handleOpenCreateModal = () => {
    setActiveTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setActiveTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActiveTask(null);
  };

  const handleModalSubmit = async (taskData) => {
    try {
      if (activeTask) {
        // Edit Mode
        const updatedTask = await api.updateTask(activeTask.id, taskData);
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      } else {
        // Create Mode
        const newTask = await api.createTask(taskData);
        setTasks(prev => [...prev, newTask]);
      }
      handleCloseModal();
    } catch (err) {
      alert(err.message || 'Failed to save task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    }
  };

  // Filter tasks based on search query and priority filters
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  return (
    <div className="app-container">
      <header className="app-header glass-panel">
        <div className="header-logo">
          <div className="logo-icon">A</div>
          <div className="logo-text">AuraTasks</div>
        </div>
        
        <div className="user-profile">
          <div className="user-info">
            <span className="username">{user.username}</span>
            <div className="connection-status">
              <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
              <span>{isConnected ? 'Sync Active' : 'Offline'}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>Sign Out</button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="toolbar-panel glass-panel">
          <div className="search-filters-wrapper">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-group">
              {['all', 'low', 'medium', 'high'].map((pFilter) => (
                <button
                  key={pFilter}
                  className={`filter-btn ${priorityFilter === pFilter ? 'active' : ''}`}
                  onClick={() => setPriorityFilter(pFilter)}
                >
                  {pFilter.charAt(0).toUpperCase() + pFilter.slice(1)} Priority
                </button>
              ))}
            </div>
          </div>

          <button className="create-task-btn" onClick={handleOpenCreateModal}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Task
          </button>
        </section>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            Loading your tasks...
          </div>
        ) : (
          <div className="kanban-board">
            {COLUMNS.map((column) => {
              const columnTasks = filteredTasks.filter(t => t.status === column.id);
              return (
                <div key={column.id} className="board-column">
                  <div className={`column-header ${column.className}`}>
                    <div className="column-title-group">
                      <h3 className="column-title">{column.title}</h3>
                      <span className="column-badge">{columnTasks.length}</span>
                    </div>
                  </div>

                  <div className="column-cards-container">
                    {columnTasks.length === 0 ? (
                      <div className="empty-col-message">No tasks in this list</div>
                    ) : (
                      columnTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onEdit={handleOpenEditModal}
                          onDelete={handleDeleteTask}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {isModalOpen && (
        <TaskModal
          task={activeTask}
          onClose={handleCloseModal}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
}
