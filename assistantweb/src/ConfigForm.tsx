import React, { useEffect, useState } from "react";


interface ConfigFormProps {
  apiKey: string;
  assistantId: string;
  setApiKey: (key: string) => void;
  setAssistantId: (id: string) => void;
  onSubmit: (vectorId: string | null) => void;
  onFilesUpdate: (files: { id: string; created_at: number; vector_store_id: string }[]) => void; // Add this line
}



const ConfigForm: React.FC<ConfigFormProps> = ({
  apiKey,
  assistantId,
  setApiKey,
  setAssistantId,
  onSubmit,
  onFilesUpdate, 
}) => {
  const [assistants, setAssistants] = useState<
    { id: string; name: string | null; tool_resources?: { file_search?: { vector_store_ids?: string[] } } }[]
  >([]);
  const [isAssistantSelected, setIsAssistantSelected] = useState<boolean>(!!assistantId);
  const [selectedVectorId, setSelectedVectorId] = useState<string | null>(null);
  const [_files, setFiles] = useState<{ id: string; created_at: number; vector_store_id: string }[]>([]);
  
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
      console.log("Assistants fetched:", data.data);
    } catch (error) {
      console.error("Error fetching assistants:", error);
    }
  };

  const fetchFiles = async (vectorStoreId: string) => {
    try {
      const response = await fetch(
        `https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`,
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
        throw new Error("Failed to fetch files");
      }
  
      const data = await response.json();
      setFiles(data.data);
      console.log("Files fetched:", data.data);
  
      // Call the callback to update the parent component
      onFilesUpdate(data.data);
    } catch (error) {
      console.error("Error fetching files:", error);
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

  useEffect(() => {
    if (selectedVectorId) {
      fetchFiles(selectedVectorId);
    } else {
      setFiles([]);
    }
  }, [selectedVectorId]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(selectedVectorId);
  };

  const handleAssistantSelect = (assistant: {
    id: string;
    name: string | null;
    tool_resources?: { file_search?: { vector_store_ids?: string[] } };
  }) => {
    setAssistantId(assistant.id);
    if (assistant.tool_resources?.file_search?.vector_store_ids && assistant.tool_resources.file_search.vector_store_ids.length > 0) {
      const vectorId = assistant.tool_resources.file_search.vector_store_ids[0];
      setSelectedVectorId(vectorId);
      console.log("First Vector Store ID of the selected assistant:", vectorId);
    } else {
      setSelectedVectorId(null);
      console.log("Vector Store ID information is not available for the selected assistant.");
    }
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
                    onClick={() => handleAssistantSelect(assistant)}
                  >
                    {assistant.name ? assistant.name : assistant.id}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={!isAssistantSelected}>
              Discuter
            </button>
          </form>
        </div>
        {/* {selectedVectorId && (
          <div className="files-container">
            <h2>Files for Vector Store ID: {selectedVectorId}</h2>
            <ul>
              {files.length > 0 ? (
                [...files].reverse().map((file, index) => (
                  <li key={file.id}>
                    {index}:{file.id}
                  </li>
                ))
              ) : (
                <li>No files found</li>
              )}
            </ul>
          </div>
        )} */}
      </div>
      
    </>
  );
};

export default ConfigForm;
