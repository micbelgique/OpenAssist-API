import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
} from '@mui/material';
import ConfigForm from './ConfigForm';

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
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [runId, setRunId] = useState<string | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!apiKey || !threadId) return;

    try {
      const response = await axios.get(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
          Authorization: `Bearer ${apiKey}`,
        },
      });
      const filteredMessages = response.data.data.filter(
        (message: { role: string }) => message.role === 'user' || message.role === 'assistant'
      );
      setMessages(filteredMessages.reverse());
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
    }
  };

  const postMessage = async (messageContent: string) => {
    if (!apiKey || !threadId) return;

    try {
      await axios.post(
        `https://api.openai.com/v1/threads/${threadId}/messages`,
        {
          role: 'user',
          content: messageContent,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
    }
  };

  const runThread = async () => {
    if (!apiKey || !threadId || !assistantId) return;

    try {
      const response = await axios.post(
        `https://api.openai.com/v1/threads/${threadId}/runs`,
        {
          assistant_id: assistantId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const newRunId = response.data.id; // Récupérer l'ID du run
      setRunId(newRunId); // Stocker l'ID du run
      checkRunStatus(newRunId); // Vérifier le statut du run avec cet ID

    } catch (error) {
      console.error("Erreur lors de l'exécution du thread:", error);
    }
  };

  const checkRunStatus = async (runId: string) => {
    if (!apiKey || !threadId) return;

    try {
      const response = await axios.get(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const runStatus = response.data.status;

      if (runStatus === 'completed') {
        fetchMessages(); // Fetch messages if the run is completed
      } else if (runStatus === 'failed' || runStatus === 'expired') {
        console.error("Le run a échoué ou a expiré.");
      } else {
        setTimeout(() => checkRunStatus(runId), 1000); // Check the status again after 1 seconds
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut du run:", error);
    }
  };

  const handleSubmitConfig = () => {
    setFormVisible(false);
    fetchMessages(); // Fetch messages after the form is submitted
  };

  const handleSubmitMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    await postMessage(userMessage); 
    await runThread();
    fetchMessages(); // Lancer le run et vérifier le statut ensuite
    setUserMessage(''); 
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {isFormVisible ? (
        <ConfigForm
          apiKey={apiKey}
          threadId={threadId}
          assistantId={assistantId}
          setApiKey={setApiKey}
          setThreadId={setThreadId}
          setAssistantId={setAssistantId}
          onSubmit={handleSubmitConfig}
        />
      ) : (
        <>
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              padding: 2,
              backgroundColor: '#242424',
              color: 'black',
            }}
            component={Paper}
            elevation={0}
            square
          >
            <Typography variant="h6" sx={{ color: 'white' }}>
              Messages
            </Typography>
            <List sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              {messages.map((message) => (
                <ListItem
                  key={message.id || Math.random()}
                  sx={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                    padding: '8px 0',
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        sx={{
                          backgroundColor: message.role === 'user' ? '#17AFE1' : '#FFF',
                          padding: '8px 12px',
                          borderRadius: '12px',
                          maxWidth: '60%',
                          wordWrap: 'break-word',
                          color: message.role === 'user' ? '#fff' : '#000',
                        }}
                      >
                        {message.content?.[0]?.text?.value || 'Message indisponible'}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
              <div ref={messagesEndRef} />
            </List>
          </Box>
          <Divider />
          <Box
            component="form"
            onSubmit={handleSubmitMessage}
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: 2,
              backgroundColor: '#fff',
            }}
          >
            <TextField
              variant="outlined"
              placeholder="Type a message..."
              fullWidth
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              sx={{ flex: 1, marginRight: 1 }}
            />
            <Button
              variant="contained"
              color="primary"
              type="submit"
              sx={{ height: '56px' }}
            >
              Envoyer
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}

export default App;
