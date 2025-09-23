const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createN8NClient } = require("./n8nClient");
const { createOpenAIClient } = require("./openaiClient");
const logger = require("./logger");

const { version } = require("../package.json");

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || "8080", 10);
const host = process.env.HOST || "0.0.0.0";
const jsonBodyLimit = process.env.JSON_BODY_LIMIT || "1mb";

app.use(cors());
app.use(express.json({ limit: jsonBodyLimit }));
app.use(express.urlencoded({ extended: true }));

const n8nClient = createN8NClient({
  apiBaseUrl: process.env.N8N_API_BASE_URL,
  webhookBaseUrl: process.env.N8N_WEBHOOK_BASE_URL,
  apiKey: process.env.N8N_API_KEY,
  basicAuthUser: process.env.N8N_BASIC_AUTH_USER,
  basicAuthPassword: process.env.N8N_BASIC_AUTH_PASSWORD,
  runEndpointTemplate:
    process.env.N8N_RUN_ENDPOINT_TEMPLATE || "/rest/workflows/:id/run",
  timeout: process.env.N8N_TIMEOUT
    ? parseInt(process.env.N8N_TIMEOUT, 10)
    : undefined,
});

const openAiClient = createOpenAIClient({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL,
  defaultModel: process.env.OPENAI_DEFAULT_MODEL,
  defaultTemperature: process.env.OPENAI_DEFAULT_TEMPERATURE
    ? Number(process.env.OPENAI_DEFAULT_TEMPERATURE)
    : undefined,
  timeout: process.env.OPENAI_TIMEOUT
    ? parseInt(process.env.OPENAI_TIMEOUT, 10)
    : undefined,
});

app.get("/", (req, res) => {
  res.json({
    name: "Lima-City MCP Server",
    status: "ok",
    version,
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", async (req, res) => {
  const services = {
    n8n: n8nClient.isConfigured()
      ? await n8nClient.healthCheck()
      : { available: false, reason: "n8n integration not configured" },
    chatgpt: openAiClient.describe(),
  };

  res.json({
    status: "ok",
    version,
    services,
    timestamp: new Date().toISOString(),
  });
});

app.post("/chatgpt/complete", async (req, res, next) => {
  try {
    const result = await openAiClient.createChatCompletion(req.body || {});
    res.json({ status: "ok", result });
  } catch (error) {
    next(error);
  }
});

app.post("/n8n/execute", async (req, res, next) => {
  try {
    if (!n8nClient.isConfigured()) {
      const err = new Error("n8n integration is not configured");
      err.status = 400;
      throw err;
    }

    const result = await n8nClient.triggerWorkflow(req.body || {});
    res.json({ status: "ok", result });
  } catch (error) {
    next(error);
  }
});

app.post("/mcp/tasks", async (req, res, next) => {
  try {
    const payload = req.body || {};
    const { prompt, context, workflow = {}, chat = {}, metadata = {} } = payload;

    const response = {
      metadata,
    };

    const shouldCallChatGPT = Boolean(
      prompt ||
        (Array.isArray(context) && context.length > 0) ||
        (Array.isArray(chat.messages) && chat.messages.length > 0)
    );

    if (shouldCallChatGPT) {
      const chatOptions = {
        prompt,
        context,
        ...chat,
      };

      response.chatgpt = await openAiClient.createChatCompletion(chatOptions);
    }

    const workflowConfig = {
      webhookUrl: workflow.webhookUrl,
      webhookSlug: workflow.webhookSlug,
      workflowId: workflow.workflowId,
      method: workflow.method,
      query: workflow.query,
    };

    const shouldTriggerWorkflow = Boolean(
      workflowConfig.webhookUrl ||
        workflowConfig.webhookSlug ||
        workflowConfig.workflowId
    );

    if (shouldTriggerWorkflow) {
      if (!n8nClient.isConfigured()) {
        const err = new Error("n8n integration is not configured");
        err.status = 400;
        throw err;
      }

      let workflowPayload = workflow.payload;

      if (!workflowPayload && payload.mergeResults !== false) {
        workflowPayload = {
          prompt,
          context,
          chatgpt: response.chatgpt,
          metadata,
        };
      }

      response.n8n = await n8nClient.triggerWorkflow({
        ...workflowConfig,
        payload: workflowPayload,
      });
    }

    res.json({ status: "completed", results: response });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({
    status: "not_found",
    message: "Endpoint not found",
  });
});

app.use((err, req, res, next) => {
  logger.error("Request failed", {
    path: req.path,
    method: req.method,
    status: err.status || 500,
    details: err.details || err.message,
  });

  res.status(err.status || 500).json({
    status: "error",
    message: err.message,
    details: err.details || undefined,
  });
});

app.listen(port, host, () => {
  logger.info("MCP server is running", {
    host,
    port,
  });
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", {
    reason: reason instanceof Error ? reason.message : reason,
  });
});

process.on("SIGTERM", () => {
  logger.info("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("Received SIGINT, shutting down gracefully");
  process.exit(0);
});
