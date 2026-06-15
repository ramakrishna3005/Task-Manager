import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Set());

  // Toast operations
  const addToast = (type, message, sender) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const newToast = { id, type, message, sender, timestamp: new Date() };
    setToasts(prev => [...prev, newToast]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 350); // Match fade animation timing
  };

  // Event listener registry
  const registerListener = (callback) => {
    listenersRef.current.add(callback);
  };

  const unregisterListener = (callback) => {
    listenersRef.current.delete(callback);
  };

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.close();
      }
      setIsConnected(false);
      return;
    }

    let reconnectTimeout;
    
    function connect() {
      const token = localStorage.getItem('token');
      if (!token) return;

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//localhost:5000?token=${token}`;
      
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket connected");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Generate human-friendly toast description
          let toastMsg = "";
          if (data.type === 'TASK_CREATED') {
            toastMsg = `created task "${data.task.title}"`;
          } else if (data.type === 'TASK_UPDATED') {
            toastMsg = `updated task "${data.task.title}"`;
          } else if (data.type === 'TASK_DELETED') {
            toastMsg = `deleted a task`;
          }

          if (toastMsg) {
            addToast(data.type, toastMsg, data.sender);
          }

          // Trigger all registered custom listeners
          listenersRef.current.forEach(callback => callback(data));
        } catch (e) {
          console.error("Error parsing WS message", e);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        console.log("WebSocket closed. Reconnecting in 3s...");
        reconnectTimeout = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
      };
    }

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.onclose = null; // Prevent reconnection trigger
        socketRef.current.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [user]);

  return (
    <WebSocketContext.Provider value={{ isConnected, toasts, removeToast, registerListener, unregisterListener }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
