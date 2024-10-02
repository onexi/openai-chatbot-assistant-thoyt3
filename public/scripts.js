let state = {
  assistant_id: null,
  assistant_name: null,
  threadId: null,
  messages: [],
};

async function getAssistant() {
  const name = document.getElementById('assistant_name').value.trim();
  if (!name) {
    writeToMessages('Please enter an assistant name.');
    return;
  }

  try {
    const response = await fetch('/api/assistants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || 'Failed to retrieve assistant');
    }

    const data = await response.json();
    if (!data.assistant_id) {
      throw new Error('No assistant ID returned');
    }

    state.assistant_id = data.assistant_id;
    state.assistant_name = data.assistant_name;
    writeToMessages(`Assistant ${state.assistant_name} is ready to chat`);
  } catch (error) {
    console.error('Error fetching assistant:', error);
    writeToMessages(`Error fetching assistant: ${error.message}`);
  }
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
    state.messages = [];
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
    return;
  }

  try {
    state.messages.push({ role: 'user', content: message });
    writeToMessages(`You: ${message}`);

    const response = await fetch('/api/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const data = await response.json();
    const messages = data.messages;

    for (const msg of messages) {
      const role = msg.role === 'user' ? 'You' : 'Assistant';
      writeToMessages(`${role}: ${msg.content}`);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    writeToMessages('Error sending message');
  } finally {
    messageInput.value = '';
  }
}

function writeToMessages(message) {
  const messageContainer = document.getElementById('message-container');
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messageElement.className = 'message';
  messageContainer.appendChild(messageElement);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}
