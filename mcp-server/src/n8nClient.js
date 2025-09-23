const axios = require("axios");
const logger = require("./logger");

function normalizeBaseUrl(url) {
  if (!url) {
    return null;
  }
  return url.replace(/\/$/, "");
}

function isAbsoluteUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

class N8NClient {
  constructor(options = {}) {
    this.apiBaseUrl = normalizeBaseUrl(options.apiBaseUrl);
    this.webhookBaseUrl = normalizeBaseUrl(options.webhookBaseUrl);
    this.apiKey = options.apiKey;
    this.basicAuth =
      options.basicAuthUser && options.basicAuthPassword
        ? {
            username: options.basicAuthUser,
            password: options.basicAuthPassword,
          }
        : null;
    this.timeout = options.timeout || 30000;
    this.runEndpointTemplate =
      options.runEndpointTemplate || "/rest/workflows/:id/run";

    this.apiHttp = this.apiBaseUrl
      ? axios.create({
          baseURL: this.apiBaseUrl,
          timeout: this.timeout,
          headers: this.apiKey
            ? {
                "X-N8N-API-KEY": this.apiKey,
              }
            : undefined,
          auth: this.basicAuth || undefined,
        })
      : null;
  }

  isConfigured() {
    return Boolean(this.apiBaseUrl || this.webhookBaseUrl);
  }

  buildWebhookUrl(identifier) {
    if (!identifier) {
      return null;
    }

    if (isAbsoluteUrl(identifier)) {
      return identifier;
    }

    if (!this.webhookBaseUrl) {
      return null;
    }

    const cleanedIdentifier = identifier.replace(/^\/+/, "");
    return `${this.webhookBaseUrl}/${cleanedIdentifier}`;
  }

  buildRunEndpoint(workflowId) {
    if (!workflowId) {
      return null;
    }

    return this.runEndpointTemplate.replace(":id", workflowId);
  }

  async healthCheck() {
    if (!this.apiHttp) {
      return {
        available: false,
        reason: "n8n API base URL not configured",
      };
    }

    const candidates = ["/healthz", "/rest/healthz", "/rest/v1/healthz"];

    for (const endpoint of candidates) {
      try {
        const response = await this.apiHttp.get(endpoint);
        return {
          available: response.status === 200,
          statusCode: response.status,
          endpoint,
          data: response.data,
        };
      } catch (error) {
        logger.debug("n8n health endpoint failed", {
          endpoint,
          status: error.response?.status,
        });
      }
    }

    return {
      available: false,
      statusCode: null,
      reason: "Unable to reach n8n health endpoint",
    };
  }

  async triggerWorkflow(options = {}) {
    const method = (options.method || "POST").toUpperCase();
    const payload = options.payload ?? {};
    const query = options.query ?? {};

    let targetUrl = options.webhookUrl || null;
    let viaApi = false;

    if (!targetUrl && (options.webhookSlug || options.workflowId)) {
      targetUrl = this.buildWebhookUrl(options.webhookSlug || options.workflowId);
    }

    if (!targetUrl && options.workflowId) {
      const endpoint = this.buildRunEndpoint(options.workflowId);
      if (!this.apiHttp || !endpoint) {
        throw new Error(
          "n8n API client is not configured to run workflows by ID"
        );
      }
      targetUrl = endpoint;
      viaApi = true;
    }

    if (!targetUrl) {
      throw new Error(
        "Unable to determine n8n endpoint. Provide webhookUrl, webhookSlug, or workflowId."
      );
    }

    logger.info("Triggering n8n workflow", {
      targetUrl,
      viaApi,
      method,
    });

    try {
      if (viaApi) {
        const response = await this.apiHttp.post(targetUrl, {
          payload,
          query,
        });

        return {
          status: response.status,
          data: response.data,
          viaApi,
          targetUrl: `${this.apiBaseUrl}${targetUrl}`,
        };
      }

      const config = {
        url: targetUrl,
        method,
        data: payload,
        params: query,
        timeout: this.timeout,
      };

      if (!isAbsoluteUrl(targetUrl) && this.webhookBaseUrl) {
        config.baseURL = this.webhookBaseUrl;
        config.url = targetUrl.replace(this.webhookBaseUrl, "");
      }

      if (this.basicAuth) {
        config.auth = this.basicAuth;
      }

      const response = await axios(config);

      return {
        status: response.status,
        data: response.data,
        viaApi,
        targetUrl: response.config.url.startsWith("http")
          ? response.config.url
          : `${response.config.baseURL}${response.config.url}`,
      };
    } catch (error) {
      logger.error("Failed to trigger n8n workflow", {
        targetUrl,
        viaApi,
        status: error.response?.status,
      });

      const err = new Error("Failed to trigger n8n workflow");
      err.status = error.response?.status || 500;
      err.details = error.response?.data || { message: error.message };
      err.targetUrl = targetUrl;
      throw err;
    }
  }
}

function createN8NClient(options) {
  return new N8NClient(options);
}

module.exports = {
  createN8NClient,
};
