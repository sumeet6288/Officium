import { randomUUID } from "crypto";

export interface Message {
  id: string;
  agentId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const conversations = new Map<string, Message[]>();

function getKey(sessionId: string, agentId: string): string {
  return `${sessionId}:${agentId}`;
}

export function getHistory(sessionId: string, agentId: string): Message[] {
  return conversations.get(getKey(sessionId, agentId)) || [];
}

export function addMessage(
  sessionId: string,
  agentId: string,
  role: "user" | "assistant",
  content: string
): Message {
  const key = getKey(sessionId, agentId);
  const messages = conversations.get(key) || [];
  const message: Message = {
    id: randomUUID(),
    agentId,
    role,
    content,
    timestamp: new Date().toISOString(),
  };
  messages.push(message);
  conversations.set(key, messages);
  return message;
}

export function clearHistory(sessionId: string, agentId: string): void {
  conversations.delete(getKey(sessionId, agentId));
}
