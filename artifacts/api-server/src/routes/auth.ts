import { Router, type IRouter } from "express";
import { SetupApiKeyBody, SetupApiKeyResponse, GetAuthStatusResponse } from "@workspace/api-zod";
import { storeApiKey, hasApiKey } from "../lib/session-store";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();

router.post("/setup", async (req, res) => {
  const parsed = SetupApiKeyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { apiKey, sessionId } = parsed.data;

  try {
    const client = new Anthropic({ apiKey });
    await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 10,
      messages: [{ role: "user", content: "Hi" }],
    });
  } catch {
    res.status(400).json({ error: "Invalid Claude API key. Please check your key and try again." });
    return;
  }

  storeApiKey(sessionId, apiKey);

  const response = SetupApiKeyResponse.parse({
    success: true,
    message: "API key configured successfully",
    sessionId,
  });

  res.json(response);
});

router.get("/status", (req, res) => {
  const sessionId = req.query.sessionId as string | undefined;
  const response = GetAuthStatusResponse.parse({
    configured: sessionId ? hasApiKey(sessionId) : false,
    sessionId,
  });
  res.json(response);
});

export default router;
