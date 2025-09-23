const axios = require("axios");
const logger = require("./logger");

function normalizeMessages(context = []) {
  if (!Array.isArray(context)) {
    return [];
  }

  return context
    .map((entry) => {
      if (!entry) {
        return undefined;
      }

      if (typeof entry === "string") {
        return { role: "user", content: entry };
      }

      const role = entry.role || entry.type;
      const content = entry.content ?? entry.message;

      if (!role || !content) {
        return undefined;
      }

      return { role, content };
    })
    .filter(Boolean);
}

class OpenAIClient {
  constructor(options = {}) {
    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL || "https://api.openai.com/v1";
    this.defaultModel = options.defaultModel || "gpt-4o-mini";
    this.defaultTemperature =
      typeof options.defaultTemperature === "number"
        ? options.defaultTemperature
        : 0.7;

    this.http = axios.create({
      baseURL: this.baseURL,
      timeout: options.timeout || 30000,
    });
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  describe() {
    return {
      configured: this.isConfigured(),
      baseURL: this.baseURL,
      defaultModel: this.defaultModel,
    };
  }

  async createChatCompletion(options = {}) {
    if (!this.isConfigured()) {
      throw new Error("OpenAI API key is not configured");
    }

    const messages = normalizeMessages(options.messages || options.context);

    if (options.system) {
      messages.unshift({ role: "system", content: options.system });
    }

    if (options.prompt) {
      messages.push({ role: "user", content: options.prompt });
    }

    if (messages.length === 0) {
      throw new Error("No messages or prompt provided for ChatGPT completion");
    }

    const payload = {
      model: options.model || this.defaultModel,
      messages,
      temperature:
        typeof options.temperature === "number"
          ? options.temperature
          : this.defaultTemperature,
    };

    if (options.maxTokens) {
      payload.max_tokens = options.maxTokens;
    }

    if (options.frequencyPenalty !== undefined) {
      payload.frequency_penalty = options.frequencyPenalty;
    }

    if (options.presencePenalty !== undefined) {
      payload.presence_penalty = options.presencePenalty;
    }

    if (options.stop) {
      payload.stop = options.stop;
    }

    logger.debug("Sending prompt to OpenAI", {
      model: payload.model,
      messageCount: payload.messages.length,
    });

    try {
      const response = await this.http.post("/chat/completions", payload, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      const choice = response.data.choices?.[0];

      return {
        id: response.data.id,
        model: response.data.model,
        created: response.data.created,
        message: choice?.message || null,
        finishReason: choice?.finish_reason || null,
        usage: response.data.usage || null,
        raw: response.data,
      };
    } catch (error) {
      logger.error("OpenAI request failed", {
        error: error.response?.data || error.message,
      });

      const err = new Error("Failed to complete ChatGPT request");
      err.status = error.response?.status || 500;
      err.details = error.response?.data || { message: error.message };
      throw err;
    }
  }
}

function createOpenAIClient(options) {
  return new OpenAIClient(options);
}

module.exports = {
  createOpenAIClient,
};
