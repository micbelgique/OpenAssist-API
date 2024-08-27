import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  interface Message {
    id: string;
    role: string;
    content?: {
      text?: {
        value: string;
      };
    }[];
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [apiKey, setApiKey] = useState<string>('');
  const [threadId, setThreadId] = useState<string>('');
  const [assistantId, setAssistantId] = useState<string>('');
  const [isFormVisible, setFormVisible] = useState<boolean>(true);
  const [userMessage, setUserMessage] = useState<string>('');

  const fetchMessages = async () => {
    if (!apiKey || !threadId) return;

    try {
      const response = await axios.get(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      const filteredMessages = response.data.data.filter(
        (message: { role: string; }) => message.role === 'user' || message.role === 'assistant'
      );

      setMessages(filteredMessages);
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
    }
  };

  const postMessage = async (messageContent: string) => {
    if (!apiKey || !threadId) return;

    try {
      await axios.post(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        role: 'user',
        content: messageContent,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
          'Authorization': `Bearer ${apiKey}`,
        },
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  };

  const runThread = async () => {
    if (!apiKey || !threadId || !assistantId) return;

    try {
      await axios.post(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        assistant_id: assistantId,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      fetchMessages(); // Fetch messages after running the thread
    } catch (error) {
      console.error('Erreur lors de l\'exécution du thread:', error);
    }
  };

  const handleSubmitConfig = (event: React.FormEvent) => {
    event.preventDefault();
    setFormVisible(false);
    fetchMessages();
  };

  const handleSubmitMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    await postMessage(userMessage);
    await runThread();
    setUserMessage(''); // Clear input field after submission
    fetchMessages(); // Fetch messages again to update the list
  };

  return (
    <>
      {isFormVisible && (
        <div className="form-container">
          <form onSubmit={handleSubmitConfig}>
            <label>
              API Key:
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </label>
            <label>
              Thread ID:
              <input
                type="text"
                value={threadId}
                onChange={(e) => setThreadId(e.target.value)}
                required
              />
            </label>
            <label>
              Assistant ID:
              <input
                type="text"
                value={assistantId}
                onChange={(e) => setAssistantId(e.target.value)}
              />
            </label>
            <button type="submit">Submit</button>
          </form>
        </div>
      )}
      <div className="messages-container">
        <h2>Messages</h2>
        <ul>
          {messages.map((message) => (
            <li key={message.id || Math.random()}>
              <strong>{message.role === 'user' ? 'Utilisateur' : 'Assistant'}:</strong>{' '}
              {message.content?.[0]?.text?.value || 'Message indisponible'}
            </li>
          ))}
        </ul>
      </div>
      {!isFormVisible && (
        <div className="message-form-container">
          <form onSubmit={handleSubmitMessage}>
            <label>
              Your Message:
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                required
              />
            </label>
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </>
  );
}

export default App;
