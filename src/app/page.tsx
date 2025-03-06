"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import MessageInput from "@/components/MessageInput";
import { Button } from "@/components/ui/button";
import { ChatSession, Message } from "@/types/chat";

// API base URL
// const API_URL = "https://chatbot-backend-jbhd.onrender.com/chat";
const API_URL = "http://0.0.0.0:8000/chat";

// API Functions
const fetchSessions = async (): Promise<ChatSession[]> => {
  const response = await fetch(`${API_URL}/sessions`);
  if (!response.ok) throw new Error("Failed to fetch sessions");
  return response.json();
};

const fetchMessages = async (sessionId: number): Promise<Message[]> => {
  const response = await fetch(`${API_URL}/${sessionId}/history`);
  if (!response.ok) throw new Error("Failed to fetch messages");
  return response.json();
};

const createNewChat = async (): Promise<ChatSession> => {
  const response = await fetch(`${API_URL}/new`, { method: "POST" });
  if (!response.ok) throw new Error("Failed to create new chat");
  return response.json();
};

const renameSession = async (sessionId: number, newName: string): Promise<ChatSession> => {
  const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName }),
  });
  if (!response.ok) throw new Error("Failed to rename session");
  return response.json();
};

const deleteSession = async (sessionId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/sessions/${sessionId}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete session");
};

const clearChatHistory = async (sessionId: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${sessionId}/history`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to clear chat history");
};

const sendMessage = async (sessionId: number, message: string, model: string): Promise<Message> => {
  console.log("Selected model:", model);
  const response = await fetch(`${API_URL}/${sessionId}?model=${model}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) throw new Error("Failed to send message");
  return response.json();
};

// Main Component
export default function Home() {
  // State Variables
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("blenderbot");
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [hasInitialized, setHasInitialized] = useState(false);

  // Theme Management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // React Query Hooks
  const { data: sessions = [], refetch: refetchSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });

  const { data: chat = [], refetch: refetchHistory } = useQuery({
    queryKey: ["chatHistory", activeSessionId],
    queryFn: () => fetchMessages(activeSessionId!),
    enabled: !!activeSessionId,
  });

  // Mutations
  const createChatMutation = useMutation({
    mutationFn: createNewChat,
    onSuccess: (newSession) => {
      refetchSessions();
      setActiveSessionId(newSession.id);
      setHasInitialized(true);
    },
    onError: (error) => {
      console.error("Error creating new chat:", error);
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ sessionId, newName }: { sessionId: number; newName: string }) =>
      renameSession(sessionId, newName),
    onSuccess: () => {
      setEditingSessionId(null);
      refetchSessions();
    },
    onError: (error) => {
      console.error("Error renaming session:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      if (sessions.length > 1) {
        setActiveSessionId(sessions.find((s) => s.id !== activeSessionId)?.id || null);
      } else {
        setActiveSessionId(null);
        setHasInitialized(false); // Allow re-initialization if no sessions remain
      }
      refetchSessions();
    },
    onError: (error) => {
      console.error("Error deleting session:", error);
    },
  });

  const clearChatMutation = useMutation({
    mutationFn: clearChatHistory,
    onSuccess: () => {
      refetchHistory();
    },
    onError: (error) => {
      console.error("Error clearing chat history:", error);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: number; message: string }) =>
      sendMessage(sessionId, message, selectedModel),
    onSuccess: () => {
      setMessage("");
      refetchHistory();
    },
    onError: (error) => {
      console.error("Error sending message:", error);
    },
  });

  // Initial Chat Setup
  useEffect(() => {
    if (!sessionsLoading && sessions.length === 0 && !hasInitialized) {
      console.log("Initializing new chat at startup");
      createChatMutation.mutate();
    }
  }, [sessionsLoading, sessions.length, hasInitialized]);

  // Set Active Session After Fetch
  useEffect(() => {
    if (!sessionsLoading && sessions.length > 0 && activeSessionId === null) {
      console.log("Setting active session:", sessions[0].id);
      setActiveSessionId(sessions[0].id);
    }
  }, [sessionsLoading, sessions, activeSessionId]);

  // Event Handlers
  const handleSend = () => {
    if (message.trim() && activeSessionId) {
      sendMessageMutation.mutate({ sessionId: activeSessionId, message });
    }
  };

  const handleEditToggle = (sessionId: number, currentName: string) => {
    setEditingSessionId(sessionId);
    setEditName(currentName);
  };

  const handleRenameSession = (sessionId: number) => {
    if (editName.trim()) {
      renameMutation.mutate({ sessionId, newName: editName });
    }
  };

  const handleDeleteSession = (sessionId: number) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      deleteMutation.mutate(sessionId);
    }
  };

  const handleNewChat = () => {
    if (!createChatMutation.isPending) {
      console.log("Creating new chat via button");
      createChatMutation.mutate();
    }
  };

  const handleClearChat = () => {
    if (activeSessionId && window.confirm("Are you sure you want to clear this chat?")) {
      clearChatMutation.mutate(activeSessionId);
    }
  };

  // JSX Structure
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
        <Button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden p-2"
          variant="ghost"
          aria-label="Open sidebar"
        >
          <svg
            className="w-6 h-6 text-gray-800 dark:text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </Button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Chatbot</h1>
        <Button
          onClick={toggleTheme}
          className="p-2"
          variant="ghost"
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? (
            <svg
              className="w-6 h-6 text-gray-800 dark:text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6 text-gray-800 dark:text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </Button>
      </header>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0 transition-transform bg-white dark:bg-gray-800 md:w-1/4 mt-16 md:mt-0 z-40`}
      >
        <div className="h-full overflow-y-auto">
          <Sidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            setActiveSessionId={setActiveSessionId}
            handleNewChat={handleNewChat}
            handleEditToggle={handleEditToggle}
            handleRenameSession={handleRenameSession}
            handleDeleteSession={handleDeleteSession}
            editingSessionId={editingSessionId}
            editName={editName}
            setEditName={setEditName}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 mt-16 flex flex-col min-h-[calc(100vh-4rem)]">
        <div className="sticky top-16 z-10 bg-gray-100 dark:bg-gray-900 p-4 flex justify-center gap-4">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="gemini-1.5-flash">Gemini 1.5</option>
            <option value="gemini-2.0-flash">Gemini 2.0</option>
          </select>
          <Button
            onClick={handleClearChat}
            disabled={!activeSessionId || chat.length === 0}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Clear Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 mb-16">
          <ChatArea chat={chat} />
        </div>
        <div className="fixed bottom-0 left-0 w-full md:left-1/4 md:w-3/4 z-10 bg-gray-100 dark:bg-gray-900 p-4">
          <MessageInput
            message={message}
            setMessage={setMessage}
            handleSend={handleSend}
            disabled={!activeSessionId || sendMessageMutation.isPending}
            isSending={sendMessageMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}