import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
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
  CircularProgress,
} from "@mui/material";
import ConfigForm from "./ConfigForm";
import NorthIcon from "@mui/icons-material/North";

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
  const [apiKey, setApiKey] = useState<string>("");
  const [threadId, setThreadId] = useState<string>("");
  const [assistantId, setAssistantId] = useState<string>("");
  const [isFormVisible, setFormVisible] = useState<boolean>(true);
  const [userMessage, setUserMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false); // Add loading state
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [runId, setRunId] = useState<string | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!apiKey || !threadId) return;

    try {
      const response = await axios.get(
        `https://api.openai.com/v1/threads/${threadId}/messages`,
        {
          headers: {
            "Content-Type": "application/json",
            "OpenAI-Beta": "assistants=v2",
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      const filteredMessages = response.data.data.filter(
        (message: { role: string }) =>
          message.role === "user" || message.role === "assistant"
      );
      setMessages(filteredMessages.reverse());
    } catch (error) {
      console.error("Erreur lors de la récupération des messages:", error);
    }
  };

  const postMessage = async (messageContent: string) => {
    if (!apiKey || !threadId) return;

    try {
      await axios.post(
        `https://api.openai.com/v1/threads/${threadId}/messages`,
        {
          role: "user",
          content: messageContent,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "OpenAI-Beta": "assistants=v2",
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
            "Content-Type": "application/json",
            "OpenAI-Beta": "assistants=v2",
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const newRunId = response.data.id;
      setRunId(newRunId);
      checkRunStatus(newRunId);
    } catch (error) {
      console.error("Erreur lors de l'exécution du thread:", error);
    }
  };

  const checkRunStatus = async (runId: string) => {
    if (!apiKey || !threadId) return;

    try {
      const response = await axios.get(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "OpenAI-Beta": "assistants=v2",
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      const runStatus = response.data.status;
      if (runStatus === "completed") {
        fetchMessages();
        setIsLoading(false);
      } else if (runStatus === "failed" || runStatus === "expired") {
        console.error("Le run a échoué ou a expiré.");
        setIsLoading(false);
      } else {
        setTimeout(() => checkRunStatus(runId), 1000);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut du run:", error);
      setIsLoading(false);
    }
  };

  const handleSubmitConfig = () => {
    setFormVisible(false);
    fetchMessages();
  };

  const handleSubmitMessage = async (event: React.FormEvent) => {
    event.preventDefault();

    await postMessage(userMessage);
    await runThread();
    fetchMessages();
    setUserMessage("");
    setIsLoading(true);
  };

  // Function to reset all variables
  const resetAll = () => {
    setMessages([]);
    setApiKey("");
    setThreadId("");
    setAssistantId("");
    setFormVisible(true);
    setUserMessage("");
    setIsLoading(false);
    setRunId(null);
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#242424",
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
          {/* "OpenAssist" button to reset all variables */}
          <Typography
            variant="h6"
            onClick={resetAll}
            sx={{ cursor: "pointer", marginBottom: 2,marginLeft:5 }}
          >
            <h2>OpenAssist</h2>
          </Typography>
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              padding: 2,
              backgroundColor: "#242424",
              color: "white",
            }}
            component={Paper}
            elevation={0}
            square
          >
            <List
              sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1,margin:5  }}
            >
              {messages.map((message) => (
                <ListItem
                  key={message.id || Math.random()}
                  sx={{
                    display: "flex",
                    justifyContent:
                      message.role === "user" ? "flex-end" : "flex-start",
                    padding: "10px 0",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        message.role === "user" ? "flex-end" : "flex-start",
                      margin: 1,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          variant="body1"
                          component="div" // Permet d'afficher le Markdown comme du HTML
                          sx={{
                            backgroundColor:
                              message.role === "user" ? "#646cff" : "#333333",
                            padding: "8px 12px",
                            borderRadius: "12px",
                            maxWidth: "80%",
                            wordWrap: "break-word",
                            color: "#fff",
                          }}
                        >
                          {/* Utilisation de ReactMarkdown pour afficher le contenu Markdown */}
                          <ReactMarkdown>
                            {message.content?.[0]?.text?.value ||
                              "Message indisponible"}
                          </ReactMarkdown>
                        </Typography>
                      }
                    />
                  </Box>
                </ListItem>
              ))}

              <div ref={messagesEndRef} />
            </List>
          </Box>
          <Divider />
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", padding: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              component="form"
              onSubmit={handleSubmitMessage}
              sx={{
                display: "flex",
                alignItems: "center",
                padding: 2,
                backgroundColor: "#2f2f2f",
                borderRadius: 2,
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
                margin: 3,
              }}
            >
              <TextField
                variant="outlined"
                placeholder="Message OpenAssist"
                fullWidth
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                sx={{
                  borderRadius: 1,
                  input: { color: "white" },
                }}
              />
              <Button
                variant="contained"
                color="primary"
                type="submit"
                sx={{
                  borderRadius: 1,
                  padding: "8px 16px",
                  marginLeft: 2,
                  width: 100,
                  backgroundColor: "#646cff",
                }}
              >
                <NorthIcon />
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

export default App;
