import { useState } from 'react';
import { MessageSquare, ArrowRight, Settings, Trash2, Edit2, Plus } from 'lucide-react';
import type { Session, Mapping } from '../App';
import { cn } from '../lib/utils';

type Props = {
  sessions: Session[];
  currentSession: Session | null;
  mappings: Record<string, Mapping[]>;
  onSelectSession: (session: Session) => void;
  onDeleteSession: (id: string) => void;
  onDeleteMapping: (id: string) => void;
  onCreateNew: () => void;
  onEditSession: (session: Session) => void;
};

export default function Dashboard({
  sessions,
  currentSession,
  mappings,
  onSelectSession,
  onDeleteSession,
  onDeleteMapping,
  onCreateNew,
  onEditSession,
}: Props) {
  const [deleteConfirmSessionId, setDeleteConfirmSessionId] = useState<string | null>(null);

  return (
    <div className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-12 gap-6">
        {/* Sessions Sidebar */}
        <div className={cn(
          "col-span-12 md:col-span-4 lg:col-span-3",
          "bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200"
        )}>
          <div className={cn(
            "p-4 border-b",
            "border-gray-200 dark:border-gray-700"
          )}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sessions</h2>
          </div>
          <div className="p-4">
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 mb-3 text-gray-400 dark:text-gray-600" />
                <h3 className="text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">No sessions yet</h3>
                <p className="text-sm mb-4 text-gray-500 dark:text-gray-400">
                  Create your first WhatsApp forwarding session
                </p>
                <button
                  onClick={onCreateNew}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 bg-green-500 hover:bg-green-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Session
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all duration-200",
                      currentSession?.id === session.id
                        ? "bg-green-50 dark:bg-gray-700"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">{session.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(mappings[session.id] || []).length} mappings
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditSession(session);
                          }}
                          className="p-1 rounded-md transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          aria-label="Edit Session"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmSessionId(session.id);
                          }}
                          className="p-1 rounded-md transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          aria-label="Delete Session"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={cn(
          "col-span-12 md:col-span-8 lg:col-span-9",
          "bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200"
        )}>
          {currentSession ? (
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {currentSession.name}
                  </h1>
                  {currentSession.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {currentSession.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">
                    {currentSession.connected ? 'Active' : 'Disconnected'}
                  </span>
                  <button
                    onClick={() => onEditSession(currentSession)}
                    className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    aria-label="Session Settings"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Active Forwarding Rules</h2>
                  <button
                    onClick={() => onEditSession(currentSession)}
                    className="mt-3 sm:mt-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                  >
                    Edit Rules
                  </button>
                </div>

                {(mappings[currentSession.id] || []).map((mapping) => (
                  <div
                    key={mapping.id}
                    className="p-4 rounded-lg border transition-all duration-200 bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
                  >
                    {/* Mapping Information */}
                    <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                      <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 flex-1">
                        {/* Source */}
                        <div className="flex items-center space-x-3 min-w-0">
                          <img
                            src={mapping.source.avatar}
                            alt={mapping.source.name}
                            className="w-10 h-10 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-normal break-words">
                              {mapping.source.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Source</p>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex justify-center">
                          <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-600" />
                        </div>

                        {/* Destination */}
                        <div className="flex items-center space-x-3 min-w-0">
                          <img
                            src={mapping.destination.avatar}
                            alt={mapping.destination.name}
                            className="w-10 h-10 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-normal break-words">
                              {mapping.destination.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Destination</p>
                          </div>
                        </div>
                      </div>
                      {/* Active / Remove */}
                      <div className="flex items-center space-x-4 mt-4 md:mt-0">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Active</span>
                        <button
                          onClick={() => onDeleteMapping(mapping.id)}
                          className="text-sm transition-colors duration-200 hover:text-red-600 dark:hover:text-red-400 text-gray-500 dark:text-gray-400"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {(mappings[currentSession.id] || []).length === 0 && (
                  <div className="text-center py-8 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <MessageSquare className="mx-auto h-12 w-12 mb-3 text-gray-400 dark:text-gray-600" />
                    <h3 className="text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">No forwarding rules</h3>
                    <p className="text-sm mb-4 text-gray-500 dark:text-gray-400">
                      Get started by adding your first forwarding rule
                    </p>
                    <button
                      onClick={() => onEditSession(currentSession)}
                      className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Rule
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <h2 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">No Session Selected</h2>
              <p className="text-sm mb-4 text-gray-500 dark:text-gray-400">
                Select a session from the sidebar or create a new one
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Session Confirmation Popup */}
      {deleteConfirmSessionId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Confirm Deletion
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete this session? This action cannot be undone and all associated mappings will be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onDeleteSession(deleteConfirmSessionId);
                  setDeleteConfirmSessionId(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirmSessionId(null)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
