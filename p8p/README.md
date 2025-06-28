# p8p

p8p is a minimal open source workflow runner inspired by [n8n](https://n8n.io). It allows defining simple workflows in JSON and executing them either via a small HTTP API or from the command line.

## Features

- Create workflows via HTTP POST `/workflow/:name`
- Run saved workflows via HTTP POST `/run/:name`
- CLI mode to execute a workflow file directly
- Supports basic `log`, `delay`, and `http` steps

## Usage

Install dependencies and start the server:

```bash
cd p8p
npm install
node cli.js
```

To run a workflow from a file:

```bash
node cli.js my-workflow.json
```

Example `my-workflow.json`:

```json
[
  { "type": "log", "message": "Hello from p8p" },
  { "type": "delay", "ms": 1000 },
  { "type": "http", "url": "https://example.com" }
]
```

This is not a full replacement for n8n but demonstrates how you might begin building your own automation tool.
