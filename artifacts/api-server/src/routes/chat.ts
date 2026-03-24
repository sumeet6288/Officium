import { Router, type IRouter } from "express";
import { SendMessageBody } from "@workspace/api-zod";
import { getApiKey } from "../lib/session-store";
import { getHistory, addMessage, clearHistory } from "../lib/conversation-store";
import { getAgent, updateAgentState } from "../data/agents";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();

router.get("/:agentId", (req, res) => {
  const { agentId } = req.params;
  const sessionId = req.query.sessionId as string;

  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const history = getHistory(sessionId, agentId);
  res.json(history);
});

router.post("/:agentId", async (req, res) => {
  const { agentId } = req.params;
  const parsed = SendMessageBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { message, sessionId } = parsed.data;
  const apiKey = getApiKey(sessionId);

  if (!apiKey) {
    res.status(400).json({ error: "No API key configured. Please set up your Claude API key first." });
    return;
  }

  const agent = getAgent(agentId);
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  updateAgentState(agentId, { status: "thinking" });

  addMessage(sessionId, agentId, "user", message);

  const history = getHistory(sessionId, agentId);
  const messages = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-20)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      system: agent.systemPrompt,
      messages,
    });

    const content = response.content[0];
    if (content.type !== "text") {
      res.status(500).json({ error: "Unexpected response type from Claude" });
      return;
    }

    const assistantMessage = addMessage(sessionId, agentId, "assistant", content.text);

    updateAgentState(agentId, { status: "working" });

    res.json(assistantMessage);
  } catch (err: unknown) {
    updateAgentState(agentId, { status: "idle" });
    const errMessage = err instanceof Error ? err.message : "Claude API error";
    res.status(500).json({ error: errMessage });
  }
});

router.delete("/:agentId", (req, res) => {
  const { agentId } = req.params;
  const sessionId = req.query.sessionId as string;

  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  clearHistory(sessionId, agentId);
  res.json({ success: true, message: "Conversation cleared" });
});

export default router;
