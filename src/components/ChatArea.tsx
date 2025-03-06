import { Message } from "@/types/chat";

interface ChatAreaProps {
  chat: Message[];
}

export default function ChatArea({ chat }: ChatAreaProps) {
  const formatText = (text: string) => {
    // Split by newlines and wrap key terms in <strong> (customize as needed)
    const lines = text.split("\n").map((line, index) => {
      if (line.includes(":")) {
        const [key, value] = line.split(": ", 2);
        return (
          <p key={index} className="mb-1">
            <strong>{key}:</strong> {value}
          </p>
        );
      }
      return <p key={index} className="mb-1">{line}</p>;
    });
    return lines;
  };

  return (
    <div className="p-4">
      {chat.length > 0 ? (
        chat.map((msg) => (
          <div
            key={msg.id}
            className={`mb-4 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-lg">
              <div
                className={`inline-block p-4 rounded-lg shadow-sm ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
                }`}
              >
                {formatText(msg.text)}
              </div>
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