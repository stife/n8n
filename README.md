# n8n-render

Successfull installation of n8n on Render using Docker.

To make it run just open Render Dashboard and use this git as Blueprint.

Important note if using disk on Render: Keep the mountPath as is, otherwise n8n won't change the data.

The .env file contain examples of lines that can be added manually on Environment Variables on Render after install.

To change the webhook URL from localhost to your domain, for example, just add the var WEBHOOK_URL followed by the full URL.

Version 0.224.1

## Facebook Page Management

A simple web interface to manage the Facebook page **"Techno auf den Augen"** is included in the [`facebook-manager`](./facebook-manager) directory. It relies on Express and the built-in Node.js `fetch` API to list and create posts.
