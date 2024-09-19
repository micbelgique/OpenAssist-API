import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import Footer from "./Footer";
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
  const [assistantId, setAssistantId] = useState<string>("");
  const [isFormVisible, setFormVisible] = useState<boolean>(true);
  const [userMessage, setUserMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [_runId, setRunId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string>("");

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createThreadAndRun = async (): Promise<string | null> => {
    if (!apiKey || !assistantId) return null;

    setIsLoading(true); // Start loading
    try {
      const response = await axios.post(
        `https://api.openai.com/v1/threads/runs`,
        {
          assistant_id: assistantId,
          thread: {
            messages: [{ role: "user", content: "présente toi." }],
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "OpenAI-Beta": "assistants=v2",
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      console.log("Response from thread creation:", response.data); // Debugging log

      const newThreadId = response.data.thread_id;
      const newRunId = response.data.id;

      if (newThreadId && newRunId) {
        setThreadId(newThreadId);
        setRunId(newRunId);
        checkRunStatus(newRunId); // Check the status without awaiting it
        return newThreadId;
      } else {
        console.error("Thread ID or Run ID is missing in the response");
        return null;
      }
    } catch (error) {
      console.error(
        "Erreur lors de la création et l'exécution du thread:",
        error
      );
      return null;
    }
  };

  const handleFilesUpdate = (
    files: { id: string; created_at: number; vector_store_id: string }[]
  ) => {
    console.log("Files updated:", files);
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
        await fetchMessages(); // Fetch messages only once when completed
      } else if (runStatus === "failed" || runStatus === "expired") {
        console.error("Le run a échoué ou a expiré.");
      } else {
        setTimeout(() => checkRunStatus(runId), 1000); // Retry checking every second
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut du run:", error);
    } finally {
      setIsLoading(false); // Always stop loading after check
    }
  };

  const handleSubmitConfig = async () => {
    setFormVisible(false);
    const newThreadId = await createThreadAndRun(); // Await and receive newThreadId
    if (newThreadId !== null) {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log("Thread ID créé:", newThreadId);
      setThreadId(newThreadId);
      fetchMessages(newThreadId);
      setIsLoading(false);
    } else {
      console.error("Erreur: Thread ID non créé.");
    }
  };

  const fetchMessages = async (threadIdParam?: string) => {
    const activeThreadId = threadIdParam || threadId; // Use the passed threadId or fallback to state
    if (!apiKey || !activeThreadId) return;

    try {
      const response = await axios.get(
        `https://api.openai.com/v1/threads/${activeThreadId}/messages`,
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

  //afficher les messages
  const formatMessageContent = (content: string) => {
    // Exemple de formatage simple. Adapte selon le format de tes références.
    return content.replace(
      /【(\d+):(\d+)†source】/g,
      (match, docId, sectionId) => {
        // Remplacer par une version lisible. Adapte cela en fonction de la structure des documents.
        return ` (Document ${docId}, section ${sectionId})`;
      }
    );
  };

  const runThreadAfterMessage = async () => {
    if (!apiKey || !assistantId || !threadId) return;

    try {
      setIsLoading(true); // Start loading

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

      const newRunId = response.data.id; // Nouveau Run ID
      setRunId(newRunId); // Mise à jour du Run ID
      checkRunStatus(newRunId); // Vérifier le statut du run
    } catch (error) {
      console.error("Erreur lors de la création et l'exécution du run:", error);
    }
  };

  const postMessage = async (messageContent: string) => {
    if (!apiKey || !threadId) return;

    const userMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: [{ text: { value: messageContent } }],
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true); // Start loading while sending the message

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

      await runThreadAfterMessage();
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
    } finally {
      setIsLoading(false); // Stop loading after the message has been sent
    }
  };

  const handleSubmitMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (userMessage.trim() === "") return; // Prevent sending empty messages

    await postMessage(userMessage); // Send the user message
    setUserMessage(""); // Clear input after sending the message
  };

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
          assistantId={assistantId}
          setApiKey={setApiKey}
          setAssistantId={setAssistantId}
          onSubmit={handleSubmitConfig}
          onFilesUpdate={handleFilesUpdate} // Pass the callback here
        />
      ) : (
        <>
          <Typography
            variant="h6"
            onClick={resetAll}
            sx={{ cursor: "pointer", marginBottom: 2, marginLeft: 5 }}
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
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                margin: 5,
              }}
            >
              {/* Filtrer les messages pour exclure le premier message de l'utilisateur */}
              {messages
                .filter((message, index, array) => {
                  // Trouver le premier message de l'utilisateur
                  const firstUserMessageIndex = array.findIndex(
                    (msg) => msg.role === "user"
                  );
                  // Exclure le premier message de l'utilisateur de l'affichage
                  return !(
                    message.role === "user" && index === firstUserMessageIndex
                  );
                })
                .map((message) => (
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
                            component="div"
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
                            <ReactMarkdown>
                              {formatMessageContent(
                                message.content?.[0]?.text?.value ||
                                  "Message indisponible"
                              )}
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
      <Footer />
    </Box>
  );
}

export default App;
