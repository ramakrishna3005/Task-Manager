import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Notification from './components/Notification';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'Outfit, sans-serif',
        color: 'var(--text-secondary)'
      }}>
        <h2>Restoring session...</h2>
      </div>
    );
  }

  return (
    <>
      {user ? <Dashboard /> : <Auth />}
      <Notification />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <AppContent />
      </WebSocketProvider>
    </AuthProvider>
  );
}
