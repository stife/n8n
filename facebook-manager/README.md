# Facebook Page Manager

This is a lightweight web interface for managing the Facebook page **"Techno auf den Augen"** using the Facebook Graph API.

## Setup

1. Install dependencies (Node.js 18+ required):
   ```bash
   npm install
   ```
2. Create environment variables for your page:
   - `FB_PAGE_ID` – the numeric ID of the Facebook page.
   - `FB_ACCESS_TOKEN` – a long-lived page access token obtained via Facebook Developers.
   - `PORT` (optional) – port to run the server (defaults to `3000`).
   - `API_VERSION` (optional) – Graph API version (defaults to `v18.0`).

3. Start the server:
   ```bash
   npm start
   ```
4. Open `http://localhost:3000` in your browser to manage posts.

## Features

- Anzeige der letzten Posts
- Veröffentlichen neuer Beiträge
- Verstellbare API-Version über `API_VERSION`

Das Projekt basiert auf Node.js mit Express und nutzt den integrierten `fetch`-Support.
