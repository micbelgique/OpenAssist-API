import React from "react";

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
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <>
      <div className="container"><h1>OpenAssist</h1></div>
      <div className="container">
        <div className="image-container">
          <img src="public/OpenAssist.png" alt="OpenAssist" />
        </div>
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
            <label>
              <span>Assistant ID:</span>
              <input
                type="text"
                value={assistantId}
                onChange={(e) => setAssistantId(e.target.value)}
              />
            </label>
            <label>
              <span>Thread ID:</span>
              <input
                type="text"
                value={threadId}
                onChange={(e) => setThreadId(e.target.value)}
                required
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
