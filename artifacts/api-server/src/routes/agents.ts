import { Router, type IRouter } from "express";
import { UpdateAgentStateBody } from "@workspace/api-zod";
import { getAgents, updateAgentState } from "../data/agents";

const router: IRouter = Router();

router.get("/", (_req, res) => {
  const agents = getAgents();
  res.json(agents);
});

router.patch("/:agentId/state", (req, res) => {
  const { agentId } = req.params;
  const parsed = UpdateAgentStateBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const updated = updateAgentState(agentId, parsed.data);
  if (!updated) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  res.json(updated);
});

export default router;
