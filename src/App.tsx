import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Moon, Sun, Plus } from 'lucide-react';
import CreateSession from './components/CreateSession';
import ScanQR from './components/ScanQR';
import SelectChats from './components/SelectChats';
import SetupForwarding from './components/SetupForwarding';
import Dashboard from './components/Dashboard';
import { cn } from './lib/utils';

export type Session = {
  id: string;
  name: string;
  description?: string;
  connected: boolean;
  createdAt: Date;
  baseUrl: string;
  apiKey?: string;
};

export type Chat = {
  id: string;
  name: string;
  lastMessage: string;
  avatar: string;
};

export type Filter = {
  words: string[];
  regex: string;
  priceAdjustment: number;
  returnIfContainsLink: boolean;
  returnIfContainsPhoneNumber: boolean;
  ignoredMediaMimetypes: string[];
  disabled: boolean;
};

export type Mapping = {
  id: string;
  source: Chat;
  destination: Chat;
  filter?: Filter;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved
      ? JSON.parse(saved)
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [mappings, setMappings] = useState<Record<string, Mapping[]>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/sessions');
        const sessions = await response.json();
        setSessions(sessions);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      }
    };

    const fetchMappings = async () => {
      try {
        const mappingsData: Record<string, Mapping[]> = {};
        for (const session of sessions) {
          const response = await fetch(`/api/sessions/${session.id}/mappings`);
          const sessionMappings = await response.json();
          mappingsData[session.id] = sessionMappings;
        }
        setMappings(mappingsData);
      } catch (error) {
        console.error('Failed to fetch mappings:', error);
      }
    };

    fetchSessions();
    if (sessions.length > 0) {
      fetchMappings();
    }
  }, [sessions.length]);

  const handleCreateSession = async (newSession: Session) => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSession),
      });
      const savedSession = await response.json();
      setSessions([...sessions, savedSession]);
      setCurrentSession(savedSession);
      setMappings({ ...mappings, [savedSession.id]: [] });
      // For a new session, go to the scan step
      navigate('/scan');
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleUpdateSession = async (updatedSession: Session) => {
    try {
      // Persist the updated session to the server
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSession),
      });
      const savedSession = await response.json();
      
      // Update local state with the saved session
      setSessions(sessions.map(s => (s.id === savedSession.id ? savedSession : s)));
      setCurrentSession(savedSession);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  // New function: update session and then jump directly to Setup Message Forwarding
  const handleUpdateSessionAndGoToSetup = async (updatedSession: Session) => {
    try {
      await handleUpdateSession(updatedSession);
      navigate('/setup');
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      // Delete session from server
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete session');
      }
      
      // Update local state after successful deletion
      setSessions(sessions.filter(s => s.id !== sessionId));
      const newMappings = { ...mappings };
      delete newMappings[sessionId];
      setMappings(newMappings);
      
      // Clear current session if it was deleted
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    }
  };

  const handleScanComplete = async () => {
    if (currentSession) {
      try {
        const response = await fetch(`/api/sessions/default`, {
          method: 'GET',
        });
        if (!response.ok) {
          throw new Error('Failed to complete scan');
        }
        const data = await response.json();
        const updatedSession = {
          ...currentSession,
          connected: data.status === 'WORKING',
          name: data.name,
          description: data.config?.description || currentSession.description,
        };
        handleUpdateSession(updatedSession);
        // Even after a scan, go to Setup Message Forwarding
        navigate('/setup');
      } catch (error) {
        console.error('Failed to complete scan:', error);
      }
    }
  };

  const handleAddMapping = async (mapping: Mapping) => {
    if (currentSession) {
      try {
        const response = await fetch(`/api/sessions/${currentSession.id}/mappings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mapping),
        });
        const savedMapping = await response.json();
        const sessionMappings = mappings[currentSession.id] || [];
        setMappings({
          ...mappings,
          [currentSession.id]: [...sessionMappings, savedMapping],
        });
      } catch (error) {
        console.error('Failed to create mapping:', error);
      }
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    if (currentSession) {
      try {
        await fetch(`/api/sessions/${currentSession.id}/mappings/${mappingId}`, {
          method: 'DELETE',
        });
        const sessionMappings = mappings[currentSession.id] || [];
        setMappings({
          ...mappings,
          [currentSession.id]: sessionMappings.filter(m => m.id !== mappingId),
        });
      } catch (error) {
        console.error('Failed to delete mapping:', error);
      }
    }
  };

  const handleEditMapping = async (mappingId: string, updatedMapping: Mapping) => {
    if (!currentSession) return;

    try {
      const response = await fetch(
        `/api/sessions/${currentSession.id}/mappings/${mappingId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedMapping),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update mapping ${mappingId}`);
      }

      const savedMapping = await response.json();
      const sessionMappings = mappings[currentSession.id] || [];
      setMappings(prev => ({
        ...prev,
        [currentSession.id]: sessionMappings.map(m =>
          m.id === mappingId ? savedMapping : m
        ),
      }));
    } catch (error) {
      console.error('Failed to update mapping:', error);
    }
  };

  const currentStep = location.pathname === '/create' ? 'create' : 
                      location.pathname === '/scan' ? 'scan' :
                      location.pathname === '/select' ? 'select' :
                      location.pathname === '/setup' ? 'setup' : 'dashboard';

  return (
    <div
      className={cn(
        'min-h-screen transition-colors duration-200',
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      )}
    >
     <nav
  className="border-b transition-colors duration-200 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between h-16">
      <div className="flex items-center">
        <MessageSquare className="h-8 w-8 text-green-500" />
        <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
          WhatsApp Forwarder
        </span>
      </div>
      <div className="flex items-center space-x-4">
        {currentSession && (
          <span className="text-sm text-gray-500 dark:text-gray-300 max-w-xs whitespace-normal break-words">
            Session: {currentSession.name}
          </span>
        )}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        {currentStep === 'dashboard' && (
          <button
            onClick={() => {
              setIsEditing(false);
              navigate('/create');
            }}
            className="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 bg-green-500 hover:bg-green-600 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Session
          </button>
        )}
      </div>
    </div>
  </div>
</nav>


      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                sessions={sessions}
                currentSession={currentSession}
                mappings={mappings}
                onSelectSession={setCurrentSession}
                onDeleteSession={handleDeleteSession}
                onDeleteMapping={handleDeleteMapping}
                onCreateNew={() => {
                  setIsEditing(false);
                  navigate('/create');
                }}
                onEditSession={(session) => {
                  setCurrentSession(session);
                  setIsEditing(true);
                  navigate('/create');
                }}
              />
            }
          />
          <Route
            path="/create"
            element={
              <CreateSession
                onSubmit={isEditing ? handleUpdateSessionAndGoToSetup : handleCreateSession}
                initialData={isEditing ? (currentSession ?? undefined) : undefined}
                onCancel={() => {
                  setIsEditing(false);
                  navigate('/');
                }}
              />
            }
          />
          <Route
            path="/scan"
            element={<ScanQR onScanComplete={handleScanComplete} />}
          />
          <Route
            path="/select"
            element={<SelectChats onContinue={() => navigate('/setup')} />}
          />
          <Route
            path="/setup"
            element={
              <SetupForwarding
                mappings={currentSession ? mappings[currentSession.id] || [] : []}
                onAddMapping={handleAddMapping}
                onDeleteMapping={handleDeleteMapping}
                onEditMapping={handleEditMapping}
                onContinue={() => navigate('/')}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
