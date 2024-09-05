import React, { useEffect, useState } from "react";

interface ConfigFormProps {
  apiKey: string;
  threadId: string;
  assistantId: string;
  setApiKey: (key: string) => void;
  setThreadId: (id: string) => void;
  setAssistantId: (id: string) => void;
  onSubmit: () => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({
  apiKey,
  threadId,
  assistantId,
  setApiKey,
  setThreadId,
  setAssistantId,
  onSubmit,
}) => {
  const [assistants, setAssistants] = useState<{ id: string; name: string | null }[]>([]);

  // Function to fetch assistants from the API
  const fetchAssistants = async () => {
    try {
      const response = await fetch("https://api.openai.com/v1/assistants?order=desc&limit=20", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch assistants");
      }

      const data = await response.json();
      setAssistants(data.data);
    } catch (error) {
      console.error("Error fetching assistants:", error);
    }
  };

  useEffect(() => {
    if (apiKey) {
      fetchAssistants();
    }
  }, [apiKey]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <>
      <div className="container">
        <h1>OpenAssist</h1>
      </div>
      <div className="container">
        {/* <div className="image-container">
          <img src="public/OpenAssist.png" alt="OpenAssist" />
        </div> */}
        <div className="form-container">
          <form onSubmit={handleSubmit} className="config-form">
            <label>
              <span>API Key:</span>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </label>
            <div>
              {/* <span>Select Assistant:</span> */}
              <div className="assistants-buttons">
                {assistants.map((assistant) => (
                  <button
                    key={assistant.id}
                    type="button"
                    className={`assistant-button ${assistantId === assistant.id ? "selected" : ""}`}
                    onClick={() => setAssistantId(assistant.id)}
                  >
                    {assistant.name ? assistant.name : assistant.id}
                  </button>
                ))}
              </div>
            </div>
            <label>
              <span>Thread ID:</span>
              <input
                type="text"
                value={threadId}
                onChange={(e) => setThreadId(e.target.value)}
               
              />
            </label>
            <button type="submit">Envoyer</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ConfigForm;
