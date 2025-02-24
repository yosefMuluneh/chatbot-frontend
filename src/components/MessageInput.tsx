// src/components/MessageInput.tsx
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  handleSend: () => void;
  disabled: boolean;
  isSending: boolean; // New prop to indicate sending state
}

export default function MessageInput({ message, setMessage, handleSend, disabled, isSending }: MessageInputProps) {
  return (
    <div className="flex gap-2">
      <Input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && !isSending && handleSend()}
        className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        placeholder="Type a message..."
        disabled={disabled}
      />
      <Button onClick={handleSend} disabled={disabled} className="px-6 py-3">
        {isSending ? "Sending..." : "Send"}
      </Button>
    </div>
  );
}