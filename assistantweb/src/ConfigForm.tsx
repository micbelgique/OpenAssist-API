import React from 'react';

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
    onSubmit(); // Directly call the parent's onSubmit to finalize the form and fetch messages
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
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
  );
};

export default ConfigForm;
