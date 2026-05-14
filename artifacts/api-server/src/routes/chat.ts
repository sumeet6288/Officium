import { Router, type IRouter } from "express";
import { getHistory, addMessage, clearHistory } from "../lib/conversation-store";
import { getAgent, updateAgentState } from "../data/agents";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router: IRouter = Router();

router.get("/:agentId", (req, res) => {
  const { agentId } = req.params;
  const sessionId = (req.query.sessionId as string) || "default";
  const history = getHistory(sessionId, agentId);
  res.json(history);
});

router.post("/:agentId", async (req, res) => {
  const { agentId } = req.params;
  const { message, sessionId = "default" } = req.body as { message: string; sessionId?: string };

  if (!message) {
    res.status(400).json({ error: "message is required" });
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

  // Build dynamic memory context from conversation history
  const totalExchanges = Math.floor(history.filter(m => m.role === 'user').length)
  const memoryNote = totalExchanges > 1
    ? `\n\n[MEMORY] You have had ${totalExchanges} previous exchanges with the CEO in this session. You remember everything discussed and build naturally on prior context — you do NOT re-introduce yourself or repeat earlier points.`
    : `\n\n[MEMORY] This is the start of your conversation with the CEO. Greet them naturally in character.`

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 8192,
      system: agent.systemPrompt + memoryNote,
      messages,
    });

    const content = response.content[0];
    if (content.type !== "text") {
      res.status(500).json({ error: "Unexpected response type" });
      return;
    }

    const assistantMessage = addMessage(sessionId, agentId, "assistant", content.text);
    updateAgentState(agentId, { status: "working" });
    res.json(assistantMessage);
  } catch (err: unknown) {
    updateAgentState(agentId, { status: "idle" });
    const errMessage = err instanceof Error ? err.message : "AI error";
    req.log.error({ err }, "Claude API error");
    res.status(500).json({ error: errMessage });
  }
});

router.delete("/:agentId", (req, res) => {
  const { agentId } = req.params;
  const sessionId = (req.query.sessionId as string) || "default";
  clearHistory(sessionId, agentId);
  res.json({ success: true, message: "Conversation cleared" });
});

export default router;
