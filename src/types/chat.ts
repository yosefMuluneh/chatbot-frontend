// src/types/chat.ts
export interface ChatSession {
    id: number;
    name: string;
    timestamp: string;
  }
  
  export interface Message {
    id: number;
    sender: "user" | "assistant";
    text: string;
    timestamp: string;
  }