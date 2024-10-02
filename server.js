import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;

// Load product data
const bankProducts = JSON.parse(fs.readFileSync(path.resolve('bank_products.json'), 'utf-8'));
const groceryProducts = JSON.parse(fs.readFileSync(path.resolve('grocery_products.json'), 'utf-8'));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from the 'public' directory

// State dictionary
let state = {
  assistant_id: null,
  assistant_name: null,
  threadId: null,
  messages: [],
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Route to get the list of Products
app.get('/api/products', (req, res) => {
  const { type } = req.query;
  if (type === 'bank') {
    res.json(bankProducts);
  } else if (type === 'grocery') {
    res.json(groceryProducts);
  } else {
    res.status(400).json({ error: 'Invalid product type' });
  }
});

// Route to get the Assistant
app.post('/api/assistants', async (req, res) => {
  const assistant_id = req.body.name;
  try {
    const myAssistant = await openai.beta.assistants.retrieve(assistant_id);

    if (!myAssistant) {
      throw new Error('Failed to retrieve assistant');
    }

    state.assistant_id = myAssistant.id;
    state.assistant_name = myAssistant.name;
    res.status(200).json(state);
  } catch (error) {
    console.error('Error fetching assistant:', error);
    res.status(500).json({ error: 'Failed to fetch assistant' });
  }
});

// Route to create a new Thread
app.post('/api/threads', async (req, res) => {
  const { assistantId } = req.body;
  try {
    const response = await openai.beta.threads.create({
      assistant_id: assistantId,
    });

    if (!response) {
      throw new Error('Failed to create thread');
    }

    const data = response.data;
    state.threadId = data.id;
    state.messages = []; // Reset messages
    res.json({ threadId: state.threadId });
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({ error: 'Failed to create thread' });
  }
});

// Route to send a message and run the Assistant
app.post('/api/run', async (req, res) => {
  const { message } = req.body;
  state.messages.push({ role: 'user', content: message });
  try {
    const runResponse = await openai.beta.threads.runs.createAndPoll(state.threadId, {
      assistant_id: state.assistant_id,
    });

    if (!runResponse) {
      throw new Error('Failed to run assistant');
    }

    const messages = await openai.beta.threads.messages.list(state.threadId);
    state.messages = messages.data;

    res.json({ messages: state.messages });
  } catch (error) {
    console.error('Error running assistant:', error);
    res.status(500).json({ error: 'Failed to run assistant' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
