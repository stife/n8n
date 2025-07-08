#!/usr/bin/env node
import fs from 'fs/promises';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

// Simple in-memory workflows
const workflows = new Map();

app.post('/workflow/:name', async (req, res) => {
  workflows.set(req.params.name, req.body);
  res.json({ status: 'saved', workflow: req.params.name });
});

app.post('/run/:name', async (_req, res) => {
  const flow = workflows.get(_req.params.name);
  if (!flow) return res.status(404).json({ error: 'Workflow not found' });
  await runWorkflow(flow);
  res.json({ status: 'executed', workflow: _req.params.name });
});

async function runWorkflow(steps) {
  for (const step of steps) {
    switch (step.type) {
      case 'log':
        console.log(step.message);
        break;
      case 'delay':
        await new Promise(resolve => setTimeout(resolve, step.ms || 0));
        break;
      case 'http':
        try {
          const res = await fetch(step.url, { method: step.method || 'GET' });
          console.log('HTTP', res.status, step.url);
        } catch (err) {
          console.error('HTTP error', err.message);
        }
        break;
      default:
        console.warn('Unknown step', step);
    }
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`p8p listening on port ${PORT}`);
});

// CLI usage: load workflow from file and run
if (process.argv[2]) {
  const filePath = path.resolve(process.cwd(), process.argv[2]);
  fs.readFile(filePath, 'utf8').then(data => {
    const flow = JSON.parse(data);
    runWorkflow(flow);
  });
}
