import React, { useState } from 'react';
import { Search, ArrowRight, MessageSquare, Info } from 'lucide-react';
import type { Chat } from '../App';
import { cn } from '../lib/utils';

type Props = {
  onContinue: () => void;
};

const MOCK_CHATS: Chat[] = [
  {
    id: '1',
    name: 'Family Group',
    lastMessage: 'Mom: When are you coming home?',
    avatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=50&h=50&fit=crop',
  },
  {
    id: '2',
    name: 'Work Team',
    lastMessage: 'John: Meeting at 3pm',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=50&h=50&fit=crop',
  },
  {
    id: '3',
    name: 'Travel Planning',
    lastMessage: 'Sarah: I found great flight deals!',
    avatar: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=50&h=50&fit=crop',
  },
];

export default function SelectChats({ onContinue }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSourceChats, setSelectedSourceChats] = useState<Set<string>>(new Set());
  const [selectedDestChats, setSelectedDestChats] = useState<Set<string>>(new Set());
  const isDark = document.documentElement.classList.contains('dark');

  const filteredChats = MOCK_CHATS.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSourceChat = (chatId: string) => {
    const newSelected = new Set(selectedSourceChats);
    if (selectedSourceChats.has(chatId)) {
      newSelected.delete(chatId);
    } else {
      newSelected.add(chatId);
    }
    setSelectedSourceChats(newSelected);
  };

  const toggleDestChat = (chatId: string) => {
    const newSelected = new Set(selectedDestChats);
    if (selectedDestChats.has(chatId)) {
      newSelected.delete(chatId);
    } else {
      newSelected.add(chatId);
    }
    setSelectedDestChats(newSelected);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className={cn(
        "rounded-lg transition-colors duration-200",
        isDark ? "bg-gray-800" : "bg-white"
      )}>
        <div className="px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-2">Select WhatsApp Chats</h1>
            <div className={cn(
              "flex items-start space-x-2 text-sm",
              isDark ? "text-gray-400" : "text-gray-600"
            )}>
              <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p>
                Choose which chats you want to monitor for messages (source) and where you want to forward these messages to (destination).
                You'll be able to create specific forwarding rules in the next step.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Source Chats */}
            <div>
              <div className="mb-4">
                <h2 className={cn(
                  "text-lg font-medium mb-1",
                  isDark ? "text-gray-200" : "text-gray-900"
                )}>Source Chats</h2>
                <p className={cn(
                  "text-sm",
                  isDark ? "text-gray-400" : "text-gray-600"
                )}>
                  Select chats to forward messages from
                </p>
              </div>

              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className={cn(
                    "h-5 w-5",
                    isDark ? "text-gray-500" : "text-gray-400"
                  )} />
                </div>
                <input
                  type="text"
                  className={cn(
                    "block w-full pl-10 pr-3 py-2 rounded-md text-sm",
                    "focus:ring-2 focus:ring-offset-2 focus:ring-green-500",
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "border border-gray-300 placeholder-gray-400"
                  )}
                  placeholder="Search chats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "flex items-center p-3 rounded-lg cursor-pointer transition-colors",
                      selectedSourceChats.has(chat.id)
                        ? isDark
                          ? "bg-green-900/30 border-green-800"
                          : "bg-green-50 border-green-200"
                        : isDark
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-50",
                      "border",
                      isDark ? "border-gray-700" : "border-gray-200"
                    )}
                    onClick={() => toggleSourceChat(chat.id)}
                  >
                    <img
                      src={chat.avatar}
                      alt={chat.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="font-medium truncate">{chat.name}</div>
                      <div className={cn(
                        "text-sm truncate",
                        isDark ? "text-gray-400" : "text-gray-500"
                      )}>
                        {chat.lastMessage}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedSourceChats.has(chat.id)}
                      onChange={() => toggleSourceChat(chat.id)}
                      className={cn(
                        "h-4 w-4 rounded",
                        isDark
                          ? "bg-gray-700 border-gray-600 text-green-500"
                          : "border-gray-300 text-green-600"
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Destination Chats */}
            <div>
              <div className="mb-4">
                <h2 className={cn(
                  "text-lg font-medium mb-1",
                  isDark ? "text-gray-200" : "text-gray-900"
                )}>Destination Chats</h2>
                <p className={cn(
                  "text-sm",
                  isDark ? "text-gray-400" : "text-gray-600"
                )}>
                  Select chats to forward messages to
                </p>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {MOCK_CHATS.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "flex items-center p-3 rounded-lg cursor-pointer transition-colors",
                      selectedDestChats.has(chat.id)
                        ? isDark
                          ? "bg-green-900/30 border-green-800"
                          : "bg-green-50 border-green-200"
                        : isDark
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-50",
                      "border",
                      isDark ? "border-gray-700" : "border-gray-200"
                    )}
                    onClick={() => toggleDestChat(chat.id)}
                  >
                    <img
                      src={chat.avatar}
                      alt={chat.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="font-medium truncate">{chat.name}</div>
                      <div className={cn(
                        "text-sm truncate",
                        isDark ? "text-gray-400" : "text-gray-500"
                      )}>
                        {chat.lastMessage}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedDestChats.has(chat.id)}
                      onChange={() => toggleDestChat(chat.id)}
                      className={cn(
                        "h-4 w-4 rounded",
                        isDark
                          ? "bg-gray-700 border-gray-600 text-green-500"
                          : "border-gray-300 text-green-600"
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={onContinue}
              disabled={selectedSourceChats.size === 0 || selectedDestChats.size === 0}
              className={cn(
                "flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isDark
                  ? "bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-700 disabled:text-gray-500"
                  : "bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-100 disabled:text-gray-400",
                "disabled:cursor-not-allowed"
              )}
            >
              Continue to Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}