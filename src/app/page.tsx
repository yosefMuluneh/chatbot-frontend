"use client";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
}

interface ChatSession {
  id: number;
  name: string;
  timestamp: string;
}

async function sendMessage({ message, model, sessionId }: { message: string; model: string; sessionId: number }) {
  const res = await fetch(`http://localhost:8000/chat/${sessionId}?model=${model}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  const data = await res.json();
  return data.response;
}

async function fetchSessions(): Promise<ChatSession[]> {
  const res = await fetch("http://localhost:8000/chat/sessions");
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json();
}

async function fetchHistory(sessionId: number): Promise<Message[]> {
  const res = await fetch(`http://localhost:8000/chat/${sessionId}/history`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

async function createNewChat(): Promise<ChatSession> {
  const res = await fetch("http://localhost:8000/chat/new", { method: "POST" });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Failed to create new chat: ${errorData.detail || res.statusText}`);
  }
  return res.json();
}

async function renameSession(sessionId: number, newName: string): Promise<ChatSession> {
  const res = await fetch(`http://localhost:8000/chat/sessions/${sessionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName }),
  });
  if (!res.ok) throw new Error("Failed to rename session");
  return res.json();
}

async function deleteSession(sessionId: number): Promise<void> {
  const res = await fetch(`http://localhost:8000/chat/sessions/${sessionId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete session");
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("blenderbot");
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const { data: sessions, refetch: refetchSessions } = useQuery({
    queryKey: ["chatSessions"],
    queryFn: fetchSessions,
    initialData: [],
  });

  const { data: chat, refetch: refetchHistory } = useQuery({
    queryKey: ["chatHistory", activeSessionId],
    queryFn: () => fetchHistory(activeSessionId!),
    enabled: !!activeSessionId,
    initialData: [],
  });

  useEffect(() => {
    const initializeSession = async () => {
      if (sessions.length === 0 && activeSessionId === null) {
        try {
          await handleNewChat();
        } catch (error) {
          console.error("Failed to auto-create session:", error);
          setActiveSessionId(null);
        }
      } else if (sessions.length > 0 && !activeSessionId) {
        setActiveSessionId(sessions[0].id);
      }
    };
    initializeSession();
  }, [sessions, activeSessionId]);

  const mutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => refetchHistory(),
    onError: () => refetchHistory(),
  });

  const handleSend = () => {
    if (!message.trim() || !activeSessionId) return;
    const userMsg: Message = { id: Date.now(), text: message, sender: "user", timestamp: new Date().toISOString() };
    setMessage("");
    mutation.mutate({ message, model: selectedModel, sessionId: activeSessionId });
  };

  const handleNewChat = async () => {
    try {
      const newSession = await createNewChat();
      await refetchSessions();
      setActiveSessionId(newSession.id);
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const handleEditToggle = (sessionId: number, currentName: string) => {
    if (editingSessionId === sessionId) {
      handleRenameSession(sessionId);
    } else {
      setEditingSessionId(sessionId);
      setEditName(currentName);
    }
  };

  const handleRenameSession = async (sessionId: number) => {
    try {
      await renameSession(sessionId, editName);
      setEditingSessionId(null);
      await refetchSessions();
    } catch (error) {
      console.error("Error renaming session:", error);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    try {
      await deleteSession(sessionId);
      await refetchSessions();
      if (activeSessionId === sessionId && sessions.length > 1) {
        setActiveSessionId(sessions.find((s) => s.id !== sessionId)?.id || null);
      } else if (sessions.length === 1) {
        setActiveSessionId(null);
        await handleNewChat(); // Auto-create if last session deleted
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/4 p-4 bg-white shadow-lg">
        <button
          onClick={handleNewChat}
          className="w-full mb-4 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          New Chat
        </button>
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group p-2 rounded-lg cursor-pointer flex items-center justify-between ${
                activeSessionId === session.id ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
              onClick={() => setActiveSessionId(session.id)}
            >
              {editingSessionId === session.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleRenameSession(session.id)}
                  onBlur={() => handleRenameSession(session.id)}
                  className="flex-1 bg-transparent border-b border-gray-300 focus:outline-none text-gray-800"
                  autoFocus
                />
              ) : (
                <span className="flex-1 text-gray-800">{session.name}</span>
              )}
              <div className="hidden group-hover:flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditToggle(session.id, session.name);
                  }}
                  className="text-gray-500 hover:text-blue-600 focus:outline-none"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id);
                  }}
                  className="text-gray-500 hover:text-red-600 focus:outline-none"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-3/4 p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Chatbot</h1>
        <div className="mb-4 flex justify-center">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="blenderbot">BlenderBot (Light)</option>
            <option value="blenderbot-smart">BlenderBot (Smart)</option>
          </select>
        </div>
        <div >
          {activeSessionId ? (
            chat.map((msg) => (
              <div
                key={msg.id}
                className={`mb-3 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div>
                  <span
                    className={`inline-block p-3 rounded-lg max-w-xs ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {msg.text}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">Starting a new chat...</p>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
            disabled={!activeSessionId}
          />
          <button
            onClick={handleSend}
            disabled={mutation.isPending || !activeSessionId}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
          >
            {mutation.isPending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}