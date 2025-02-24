// src/components/Sidebar.tsx
"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatSession } from "@/types/chat";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: number | null;
  setActiveSessionId: (id: number) => void;
  handleNewChat: () => void;
  handleEditToggle: (sessionId: number, currentName: string) => void;
  handleRenameSession: (sessionId: number) => void;
  handleDeleteSession: (sessionId: number) => void;
  editingSessionId: number | null;
  editName: string;
  setEditName: (name: string) => void;
  onClose: () => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  setActiveSessionId,
  handleNewChat,
  handleEditToggle,
  handleRenameSession,
  handleDeleteSession,
  editingSessionId,
  editName,
  setEditName,
  onClose,
}: SidebarProps) {
  return (
    <div className="w-full  h-full bg-white dark:bg-gray-800 p-4 shadow-lg">
      <Button onClick={handleNewChat} className="w-full mb-4">
        New Chat
      </Button>
      <div className="space-y-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`group p-2 rounded-lg cursor-pointer flex items-center justify-between ${
              activeSessionId === session.id ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            onClick={() => setActiveSessionId(session.id)}
          >
            {editingSessionId === session.id ? (
              <Input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleRenameSession(session.id)}
                onBlur={() => handleRenameSession(session.id)}
                className="flex-1 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none text-gray-800 dark:text-white"
                autoFocus
              />
            ) : (
              <span className="flex-1 text-gray-800 dark:text-white truncate">{session.name}</span>
            )}
            <div className="hidden group-hover:flex space-x-2">
              <Button
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditToggle(session.id, session.name);
                }}
                className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
              >
                ✏️
              </Button>
              <Button
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSession(session.id);
                }}
                className="text-gray-500 hover:text-red-600 dark:hover:text-red-400"
              >
                🗑️
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button variant="ghost" onClick={onClose} className="mt-4 md:hidden">
        Close
      </Button>
    </div>
  );
}