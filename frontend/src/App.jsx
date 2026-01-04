import React, { useState, useEffect } from 'react';
import AuthPortal from './components/AuthPortal';
import Sidebar from './components/Sidebar';
import MainArea from './components/MainArea';
import { ToastProvider } from './components/Toast';

const AppContent = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setChats([]);
    setCurrentChatId(null);
    setProcessedData(null);
  };

  useEffect(() => {
    if (!token) return;

    const fetchUser = async () => {
      try {
        const res = await fetch('/api/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          logout();
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchChats = async () => {
      try {
        const res = await fetch('/api/chats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setChats(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
    fetchChats();
  }, [token]);

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  if (!token) {
    return <AuthPortal onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        chats={chats}
        currentChatId={currentChatId}
        setCurrentChatId={setCurrentChatId}
        apiKey={apiKey}
        setApiKey={setApiKey}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        onLogout={logout}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onNewChat={() => {
          setCurrentChatId(null);
          setProcessedData(null);
        }}
      />
      <MainArea
        token={token}
        apiKey={apiKey}
        selectedModel={selectedModel}
        currentChatId={currentChatId}
        setCurrentChatId={setCurrentChatId}
        processedData={processedData}
        setProcessedData={setProcessedData}
        onChatCreated={() => {
          setToken(localStorage.getItem('token'));
        }}
      />
    </div>
  );
};

const App = () => (
  <ToastProvider>
    <AppContent />
  </ToastProvider>
);

export default App;
