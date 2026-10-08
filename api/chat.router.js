import express from "express";
import { agentService } from "../services/agent.service.js";

export const chatRouter = express.Router();

const MAX_TEXT = 15000;

const isText = (value) => typeof value === "string" && value.trim().length > 0;

chatRouter.post("/", async (req, res) => {
  const { username, jobLink, jobDescription, sessionId, message, approval } =
    req.body ?? {};
  const bad = (msg) => res.status(400).json({ status: "error", message: msg });

  // FIRST REQUEST: no sessionId, so it starts a new conversation
  if (!sessionId) {
    if (!isText(username) || username.trim().length > 40) {
      return bad("username is required (max 40 characters)");
    }
    if (isText(jobLink) === isText(jobDescription)) {
      return bad("Provide exactly one of jobLink or jobDescription");
    }
    if (isText(jobLink) && jobLink.length > 2000) {
      return bad("jobLink is too long");
    }
    if (isText(jobDescription) && jobDescription.length > MAX_TEXT) {
      return bad(`jobDescription must be at most ${MAX_TEXT} characters`);
    }

    // The link is not checked here: the agent must meet a broken link itself
    const result = await agentService.start({
      username: username.trim(),
      jobLink: isText(jobLink) ? jobLink.trim() : undefined,
      jobDescription: isText(jobDescription)
        ? jobDescription.trim()
        : undefined,
    });
    return res.status(200).json(result);
  }

  // FOLLOW-UP REQUEST: sessionId present, so it continues a conversation
  if (!isText(sessionId)) {
    return bad("sessionId must be a non-empty string");
  }
  if (isText(message) === (approval !== undefined)) {
    return bad("Provide exactly one of message or approval");
  }
  if (isText(message) && message.length > MAX_TEXT) {
    return bad(`message must be at most ${MAX_TEXT} characters`);
  }
  if (
    approval !== undefined &&
    approval !== "approved" &&
    approval !== "denied"
  ) {
    return bad('approval must be "approved" or "denied"');
  }

  // The service throws status 404 (unknown session) and 409 (wrong state);
  // Express 5 forwards those to the error handler
  const result = await agentService.continue({
    sessionId,
    message: isText(message) ? message.trim() : undefined,
    approval,
  });
  return res.status(200).json(result);
});
