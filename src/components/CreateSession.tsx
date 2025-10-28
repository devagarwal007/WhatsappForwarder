import React, { useState } from 'react';
import type { Session } from '../App';
import { cn } from '../lib/utils';

type Props = {
  onSubmit: (session: Session) => void;
  onCancel: () => void;
  initialData?: Session;
};

export default function CreateSession({ onSubmit, onCancel, initialData }: Props) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [baseUrl, setBaseUrl] = useState(initialData?.baseUrl || '');
  const [apiKey, setApiKey] = useState(initialData?.apiKey || '');
  const isDark = document.documentElement.classList.contains('dark');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: initialData?.id || crypto.randomUUID(),
      name,
      description,
      baseUrl, // include the base URL in the session object
      apiKey, // include the API key in the session object
      connected: initialData?.connected || false,
      createdAt: initialData?.createdAt || new Date(),
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className={cn(
        "rounded-lg transition-colors duration-200",
        isDark ? "bg-gray-800" : "bg-white"
      )}>
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-semibold mb-8">
            {initialData ? 'Edit Session' : 'Create a New Session'}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className={cn(
                "block text-sm font-medium mb-1",
                isDark ? "text-gray-200" : "text-gray-700"
              )}>
                Session Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={cn(
                  "block w-full rounded-md shadow-sm sm:text-sm",
                  "focus:ring-2 focus:ring-offset-2 focus:ring-green-500",
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "border-gray-300 placeholder-gray-400"
                )}
                placeholder="My WhatsApp Session"
              />
            </div>

            <div>
              <label htmlFor="description" className={cn(
                "block text-sm font-medium mb-1",
                isDark ? "text-gray-200" : "text-gray-700"
              )}>
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={cn(
                  "block w-full rounded-md shadow-sm sm:text-sm",
                  "focus:ring-2 focus:ring-offset-2 focus:ring-green-500",
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "border-gray-300 placeholder-gray-400"
                )}
                placeholder="What's this session for?"
              />
            </div>

            <div>
              <label htmlFor="baseUrl" className={cn(
                "block text-sm font-medium mb-1",
                isDark ? "text-gray-200" : "text-gray-700"
              )}>
                Base URL
              </label>
              <input
                type="url"
                name="baseUrl"
                id="baseUrl"
                required
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className={cn(
                  "block w-full rounded-md shadow-sm sm:text-sm",
                  "focus:ring-2 focus:ring-offset-2 focus:ring-green-500",
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "border-gray-300 placeholder-gray-400"
                )}
                placeholder="http://localhost:3000"
              />
            </div>

            <div>
              <label htmlFor="apiKey" className={cn(
                "block text-sm font-medium mb-1",
                isDark ? "text-gray-200" : "text-gray-700"
              )}>
                WAHA API Key (Optional)
              </label>
              <input
                type="password"
                name="apiKey"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className={cn(
                  "block w-full rounded-md shadow-sm sm:text-sm",
                  "focus:ring-2 focus:ring-offset-2 focus:ring-green-500",
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "border-gray-300 placeholder-gray-400"
                )}
                placeholder="your-api-key-here"
              />
              <p className={cn(
                "mt-1 text-xs",
                isDark ? "text-gray-400" : "text-gray-500"
              )}>
                API key for authenticating with WAHA server (leave empty if not required)
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className={cn(
                  "flex-1 py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500",
                  isDark
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-green-500 hover:bg-green-600"
                )}
              >
                {initialData ? 'Save Changes' : 'Create Session'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md shadow-sm text-sm font-medium",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2",
                  isDark
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                )}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
