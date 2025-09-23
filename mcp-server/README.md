# P8P-Ki_MCP-Server

Ein schlanker Node.js-Server, der das **Model Context Protocol (MCP)** für Automatisierungen auf deiner Lima-City Cloud VPS umsetzt. Er fungiert als Brücke zwischen deiner n8n-Instanz und ChatGPT (OpenAI-kompatible APIs) und wurde auf den Betrieb unter der Domain **`https://mcp.die-paten.biz`** ausgelegt.

## Funktionsumfang

- 🌐 Einheitliches HTTP-Interface (`/mcp/tasks`) zur Orchestrierung von ChatGPT-Anfragen und n8n-Workflows.
- 🤖 Direkte Weiterleitungen an beliebige n8n-Webhooks oder Workflow-Ausführungen via REST-API.
- 🧠 ChatGPT/ OpenAI-Anbindung inkl. Modell- und Temperatursteuerung.
- 📊 Gesundheitschecks für beide Integrationen über `/health`.
- 🔒 Unterstützung für Basic-Auth geschützte n8n-Instanzen und API-Keys.
- 🪪 Bereit für den Einsatz hinter einem Reverse Proxy (z. B. Nginx) auf Lima-City VPS.

## Installation

```bash
cd mcp-server
npm install
cp .env.example .env
```

Bearbeite anschließend die `.env` Datei mit deinen Zugangsdaten (siehe [Konfiguration](#konfiguration)).

### Systemdienst auf Lima-City VPS

1. **Systemd Service anlegen** (`/etc/systemd/system/mcp-server.service`):
   ```ini
   [Unit]
   Description=Lima-City MCP Server
   After=network.target

   [Service]
   Type=simple
   WorkingDirectory=/var/www/mcp-server
   ExecStart=/usr/bin/node src/index.js
   Restart=on-failure
   Environment=NODE_ENV=production
   EnvironmentFile=/var/www/mcp-server/.env

   [Install]
   WantedBy=multi-user.target
   ```
2. Projekt nach `/var/www/mcp-server` deployen (z. B. per git pull).
3. `sudo systemctl daemon-reload`
4. `sudo systemctl enable --now mcp-server`

### Reverse Proxy (Beispiel Nginx)

```nginx
server {
    server_name mcp.die-paten.biz;

    listen 80;
    listen [::]:80;
    return 301 https://$host$request_uri;
}

server {
    server_name mcp.die-paten.biz;

    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    ssl_certificate     /etc/letsencrypt/live/mcp.die-paten.biz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mcp.die-paten.biz/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

## Konfiguration

Alle relevanten Umgebungsvariablen findest du in der Datei [`.env.example`](./.env.example).

| Variable | Beschreibung |
| --- | --- |
| `PORT` / `HOST` | Port/Host, auf dem der MCP-Server lauscht (Standard: 8080 / 0.0.0.0). |
| `JSON_BODY_LIMIT` | Max. Größe eingehender JSON Payloads (z. B. `1mb`). |
| `N8N_API_BASE_URL` | Basis-URL deiner n8n-Instanz (ohne `/webhook`). |
| `N8N_API_KEY` | Optionaler API-Key für n8n (z. B. Personal Access Token). |
| `N8N_WEBHOOK_BASE_URL` | Basis-URL für Webhook-Aufrufe (z. B. `https://automation.example.com/webhook`). |
| `N8N_BASIC_AUTH_USER` / `N8N_BASIC_AUTH_PASSWORD` | Optional: Basic Auth Zugangsdaten, wenn n8n geschützt ist. |
| `N8N_RUN_ENDPOINT_TEMPLATE` | Pfad-Template zum Ausführen eines Workflows via API (`/rest/workflows/:id/run`). |
| `OPENAI_API_KEY` | API-Key für ChatGPT/OpenAI-kompatible Anbieter. |
| `OPENAI_API_BASE_URL` | Alternative API-URL, falls du einen kompatiblen Anbieter nutzt. |
| `OPENAI_DEFAULT_MODEL` | Standardmodell (z. B. `gpt-4o-mini`). |
| `OPENAI_DEFAULT_TEMPERATURE` | Optionale Standardtemperatur (Float). |

> **Hinweis:** Für Lima-City Firewalls Ports öffnen (`iptables`/`ufw`) und sicherstellen, dass `8080/tcp` intern erreichbar ist. Der externe Zugriff erfolgt ausschließlich über den Reverse Proxy.

## Endpunkte

### `GET /`
Liefert eine kurze Statusmeldung des Servers.

### `GET /health`
Gibt die aktuellen Gesundheitsinformationen der n8n- und ChatGPT-Anbindungen zurück.

### `POST /chatgpt/complete`
Erzeugt eine ChatGPT-Antwort. Beispielpayload:

```json
{
  "prompt": "Erstelle eine Zusammenfassung der letzten Supportanfrage.",
  "context": [
    { "role": "system", "content": "Du bist ein Support-Agent." },
    { "role": "user", "content": "Kunde meldet Fehler 42 bei der Registrierung." }
  ],
  "model": "gpt-4o-mini",
  "temperature": 0.2
}
```

### `POST /n8n/execute`
Löst einen Workflow aus. Beispiel (Webhook):

```json
{
  "webhookSlug": "support-intake",
  "payload": {
    "ticketId": "4711",
    "message": "Der Kunde benötigt Hilfe." }
}
```

### `POST /mcp/tasks`
Kombinierter Endpunkt, um ChatGPT und n8n hintereinander aufzurufen.

```json
{
  "prompt": "Fasse das Meeting in Stichpunkten zusammen.",
  "context": [
    "Meetingnotizen vom 12.05."
  ],
  "chat": {
    "model": "gpt-4o-mini"
  },
  "workflow": {
    "webhookSlug": "send-meeting-summary",
    "payload": {
      "recipient": "team@die-paten.biz"
    }
  }
}
```

Der MCP-Server ergänzt automatisch das ChatGPT-Ergebnis und leitet es (sofern `mergeResults` nicht auf `false` gesetzt ist) an n8n weiter.

## Nutzung mit ChatGPT / OpenAI

- Richte in ChatGPT (Custom GPT oder API) einen **Webhook** auf `https://mcp.die-paten.biz/mcp/tasks` ein.
- Übermittle in der Payload den gewünschten Prompt sowie optional ein Ziel in n8n.
- Die Antwort enthält sowohl die ChatGPT-Ausgabe als auch die Antwort deines n8n-Workflows.

## Nutzung mit n8n

- Verwende den HTTP Request Node, um ChatGPT über `/chatgpt/complete` aufzurufen.
- Nutze Webhook-Trigger in n8n, um `/mcp/tasks` als zentrale Schnittstelle anzusprechen.
- Der Endpunkt ist ideal, um nachgelagerte Automationen in n8n zu starten und gleichzeitig ChatGPT in die Verarbeitung einzubeziehen.

## Entwicklung

```bash
npm run dev
```

Standardmäßig wird auf `http://localhost:8080` gelauscht. Mit `LOG_LEVEL=debug` erhältst du detaillierte Logs.

## Fehlerbehebung

- Prüfe `/health`, falls Antworten ausbleiben.
- Aktiviere `LOG_LEVEL=debug`, um Anfrage- und Antwortdaten zu prüfen (sensitiven Inhalt zuvor maskieren!).
- Bei n8n-Workflows ohne API-Key sollte `N8N_WEBHOOK_BASE_URL` gesetzt sein – andernfalls verwende einen vollständigen `webhookUrl` im Request.

Viel Erfolg beim Betrieb auf **mcp.die-paten.biz**! ✨
