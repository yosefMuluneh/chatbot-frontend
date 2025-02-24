// src/components/ChatArea.tsx
import { Message } from "@/types/chat";

interface ChatAreaProps {
  chat: Message[];
}

export default function ChatArea({ chat }: ChatAreaProps) {
  return (
    <div>
      {chat.length > 0 ? (
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
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
                }`}
              >
                {msg.text}
              </span>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400">No messages yet—start chatting!</p>
      )}
    </div>
  );
}