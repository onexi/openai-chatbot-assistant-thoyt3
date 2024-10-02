// Initiate the state object with the assistant_id and threadId as null and an empty array for messages
let state = {
  assistant_id: null,
  assistant_name: null,
  threadId: null,
  messages: [],
};
async function getAssistant(){
  let name = document.getElementById('assistant_name').value;
  console.log(`assistant_id: ${name}`)
  const response = await fetch('/api/assistants', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: name }),
  });
  state = await response.json();  // the state object is updated with the response from the server
  writeToMessages(`Assistant ${state.assistant_name} is ready to chat`);
  console.log(`back from fetch with state: ${JSON.stringify(state)}`)
}

async function getThread() {
  try {
    const response = await fetch('/api/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assistantId: state.assistant_id }),
    });

    if (!response.ok) {
      throw new Error('Failed to create thread');
    }

    const data = await response.json();
    state.threadId = data.threadId;
    state.messages = []; // Reset messages
    writeToMessages(`New thread created with ID: ${state.threadId}`);
  } catch (error) {
    console.error('Error creating thread:', error);
    writeToMessages('Error creating thread');
  }
}

async function getResponse() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();

  if (!message) {
    return; // Don't send empty messages
  }

  try {
    // Add the user's message to the chat
    state.messages.push({ role: 'user', content: message });
    writeToMessages(`You: ${message}`);

    // Send the message to the server
    const response = await fetch('/api/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: message }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const data = await response.json();
    const messages = data.messages;

    // Display all messages
    for (const msg of messages) {
      const role = msg.role === 'user' ? 'You' : 'Assistant';
      writeToMessages(`${role}: ${msg.content}`);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    writeToMessages('Error sending message');
  } finally {
    messageInput.value = ''; // Clear the input field
  }
}

async function writeToMessages(message) {
  const messageContainer = document.getElementById('message-container');
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messageElement.className = 'message';
  messageContainer.appendChild(messageElement);
  messageContainer.scrollTop = messageContainer.scrollHeight; // Scroll to the bottom
}
