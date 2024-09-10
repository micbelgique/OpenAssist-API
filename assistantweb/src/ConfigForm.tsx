import React, { useEffect, useState } from "react";

interface ConfigFormProps {
  apiKey: string;
  assistantId: string;
  setApiKey: (key: string) => void;
  setAssistantId: (id: string) => void;
  onSubmit: () => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({
  apiKey,
  assistantId,
  setApiKey,
  setAssistantId,
  onSubmit,
}) => {
  const [assistants, setAssistants] = useState<
    { id: string; name: string | null }[]
  >([]);
  const [isAssistantSelected, setIsAssistantSelected] = useState<boolean>(!!assistantId);

  // Function to fetch assistants from the API
  const fetchAssistants = async () => {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/assistants?order=desc&limit=20",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );

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

  useEffect(() => {
    setIsAssistantSelected(!!assistantId);
  }, [assistantId]);

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
              <div className="assistants-buttons">
                {assistants.map((assistant) => (
                  <button
                    key={assistant.id}
                    type="button"
                    className={`assistant-button ${
                      assistantId === assistant.id ? "selected" : ""
                    }`}
                    onClick={() => setAssistantId(assistant.id)}
                  >
                    {assistant.name ? assistant.name : assistant.id}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={!isAssistantSelected}>
              Envoyer
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ConfigForm;
