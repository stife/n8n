# n8n-render

Successful installation of n8n on Render using Docker.

To make it run just open Render Dashboard and use this git as Blueprint.

Important note if using disk on Render: Keep the mountPath as is, otherwise n8n won't change the data.

The `.env.example` file contains example environment variables you can copy to your own `.env` file or add manually on Render after install.

To change the webhook URL from localhost to your domain, for example, just add the var WEBHOOK_URL followed by the full URL.

Version 0.224.1

## Setup

1. Install dependencies (Node.js 18+ required):
   ```bash
   npm install
   ```

## Facebook Page Management

A simple web interface to manage the Facebook page **"Techno auf den Augen"** is included in the [`facebook-manager`](./facebook-manager) directory. It relies on Express and the built-in Node.js `fetch` API to list and create posts and display basic page insights. Further documentation is available in the [Facebook manager wiki](./facebook-manager/WIKI.md).

## Lima-City MCP Server

The [`mcp-server`](./mcp-server) directory contains a dedicated Node.js service that exposes a Model Context Protocol (MCP) bridge for n8n and ChatGPT. It is designed to run on the Lima-City cloud VPS under `https://mcp.die-paten.biz` and provides:

- A combined `/mcp/tasks` endpoint to orchestrate ChatGPT prompts and n8n workflows.
- Stand-alone `/chatgpt/complete` and `/n8n/execute` endpoints for direct integrations.
- Health checks and configuration via environment variables (see [`mcp-server/.env.example`](./mcp-server/.env.example)).

Follow the [MCP server README](./mcp-server/README.md) for deployment instructions, reverse proxy examples, and integration tips.
