const express = require('express');
const path = require('path');

const PAGE_ID = process.env.FB_PAGE_ID; // Techno auf den Augen page ID
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN; // long-lived Page access token
const API_VERSION = process.env.API_VERSION || 'v18.0';
const GRAPH_URL = `https://graph.facebook.com/${API_VERSION}`;

if (!PAGE_ID || !ACCESS_TOKEN) {
  console.error('Please set FB_PAGE_ID and FB_ACCESS_TOKEN environment variables.');
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/posts', async (req, res) => {
  try {
    const response = await fetch(`${GRAPH_URL}/${PAGE_ID}/posts?access_token=${ACCESS_TOKEN}`);
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch posts', details: e.message });
  }
});

app.post('/api/posts', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }
  try {
    const response = await fetch(`${GRAPH_URL}/${PAGE_ID}/feed?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create post', details: e.message });
  }
});

app.get('/api/insights', async (req, res) => {
  const metrics = 'page_impressions,page_engaged_users';
  try {
    const response = await fetch(`${GRAPH_URL}/${PAGE_ID}/insights?metric=${metrics}&access_token=${ACCESS_TOKEN}`);
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch insights', details: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Facebook manager running on port ${PORT}`);
});
