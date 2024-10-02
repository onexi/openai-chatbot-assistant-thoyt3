// server.js

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

// Node.js v20 supports fetch natively
const app = express();
const PORT = 3000;

// Load product data
const bankProducts = JSON.parse(
  fs.readFileSync(path.resolve('bank_products.json'), 'utf-8')
);
const groceryProducts = JSON.parse(
  fs.readFileSync(path.resolve('grocery_products.json'), 'utf-8')
);

// Create a system prompt with detailed product information
const systemPrompt = `
You are an assistant knowledgeable about bank and grocery store products. Provide detailed information when asked.

Bank Products:
${bankProducts
  .map(
    (product) =>
      `- ${product.name}: ${product.description}. Rate: ${product.rate}, Type: ${product.type}, Additional Info: ${product.additional}`
  )
  .join('\n')}

Grocery Products:
${groceryProducts
  .map(
    (product) =>
      `- ${product.name}: ${product.description}. Price: ${product.price}, Type: ${product.type}, Additional Info: ${product.additional}`
  )
  .join('\n')}
`;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from the 'public' directory

// Thread storage
let threads = {};

// Route to create a new thread
app.post('/api/threads', (req, res) => {
  const threadId = `thread_${Date.now()}`;
  threads[threadId] = {
    assistant: 'default_assistant',
    messages: [{ role: 'system', content: systemPrompt }],
  };
  res.json({ threadId });
});

// Route to add a message to a thread
app.post('/api/threads/:threadId/messages', (req, res) => {
  const { threadId } = req.params;
  const { message } = req.body;

  if (!threads[threadId]) {
    return res.status(404).json({ error: 'Thread not found' });
  }

  threads[threadId].messages.push({ role: 'user', content: message });
  res.json({ success: true });
});

// Route to run the thread (send messages to OpenAI API)
app.post('/api/threads/:threadId/run', async (req, res) => {
  const { threadId } = req.params;

  if (!threads[threadId]) {
    return res.status(404).json({ error: 'Thread not found' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: threads[threadId].messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error running assistant:', data);
      return res.status(response.status).json({ error: data.error.message });
    }

    const assistantMessage = data.choices[0].message;
    threads[threadId].messages.push(assistantMessage);

    res.json({ success: true });
  } catch (error) {
    console.error('Error running assistant:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route to get all messages from a thread
app.get('/api/threads/:threadId/messages', (req, res) => {
  const { threadId } = req.params;

  if (!threads[threadId]) {
    return res.status(404).json({ error: 'Thread not found' });
  }

  res.json({ messages: threads[threadId].messages });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
