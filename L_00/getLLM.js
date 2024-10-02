import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getResponse(prompt) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt }
    ]
  });
  const generatedResponse = response.choices[0].message.content
  // Send the response back to the client
  console.log(generatedResponse);
}

getResponse('Where is MIT located?');

// to run, ensure you are in the L_00 directory (by typing "cd L_00" in the terminal)
// and run the following command: "node getLLM.js" in the terminal
// to get back up to the root directory, type "cd .." in the terminal