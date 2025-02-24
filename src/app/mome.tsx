"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import MessageInput from "@/components/MessageInput";
import { Button } from "@/components/ui/button"; // Assuming Shadcn UI is installed
import { ChatSession, Message } from "@/types/chat";

// API base URL (adjust this based on your backend configuration)
const API_URL = "http://localhost:8000/chat";

// **API Functions**
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
  const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete session");
};

const sendMessage = async (sessionId: number, message: string): Promise<Message> => {
  const response = await fetch(`${API_URL}/${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) throw new Error("Failed to send message");
  return response.json();
};

// **Main Component**
export default function Home() {
  // **State Variables**
  const [message, setMessage] = useState(""); // Current message input
  const [selectedModel, setSelectedModel] = useState("blenderbot"); // Selected AI model
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null); // Active chat session
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null); // Session being edited
  const [editName, setEditName] = useState(""); // New name for editing session
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Sidebar visibility on mobile
  const [theme, setTheme] = useState(() => {
    // Initialize theme from localStorage or default to "light"
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme : "light";
  });

  // **Theme Management**
  useEffect(() => {
    // Apply theme class to document root and save to localStorage
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

  // **React Query Hooks**
  // Fetch all chat sessions
  const { data: sessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });

  // Fetch messages for the active session
  const { data: chat = [], refetch: refetchHistory } = useQuery({
    queryKey: ["chatHistory", activeSessionId],
    queryFn: () => fetchMessages(activeSessionId!),
    enabled: !!activeSessionId, // Only fetch if there's an active session
  });

  // Auto-create a session if none exist
  useEffect(() => {
    if (sessions.length === 0 && activeSessionId === null) {
      createChatMutation.mutate();
    } else if (sessions.length > 0 && activeSessionId === null) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  // **Mutations for API Actions**
  const createChatMutation = useMutation({
    mutationFn: createNewChat,
    onSuccess: (newSession) => {
      refetchSessions();
      setActiveSessionId(newSession.id); // Set new session as active
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ sessionId, newName }: { sessionId: number; newName: string }) =>
      renameSession(sessionId, newName),
    onSuccess: () => {
      setEditingSessionId(null); // Exit editing mode
      refetchSessions();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      if (sessions.length > 1) {
        // Switch to another session if available
        setActiveSessionId(sessions.find((s) => s.id !== activeSessionId)?.id || null);
      } else {
        setActiveSessionId(null); // No sessions left
      }
      refetchSessions();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: number; message: string }) =>
      sendMessage(sessionId, message),
    onSuccess: () => {
      setMessage(""); // Clear input
      refetchHistory(); // Refresh chat history
    },
  });

  // **Event Handlers**
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

  // **JSX Structure**
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
        <Button onClick={() => setIsSidebarOpen(true)} className="md:hidden">
          Menu
        </Button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Chatbot</h1>
        <Button onClick={toggleTheme}>
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </Button>
      </header>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 transition-transform bg-white dark:bg-gray-800 md:w-1/4 mt-16 md:mt-0`}
      >
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          handleNewChat={() => createChatMutation.mutate()}
          handleEditToggle={handleEditToggle}
          handleRenameSession={handleRenameSession}
          handleDeleteSession={handleDeleteSession}
          editingSessionId={editingSessionId}
          editName={editName}
          setEditName={setEditName}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 mt-16">
        <ChatArea chat={chat} />
        <MessageInput
          message={message}
          setMessage={setMessage}
          handleSend={handleSend}
          disabled={!activeSessionId}
        />
      </div>
    </div>
  );
}