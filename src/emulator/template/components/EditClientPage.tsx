import React, { useState } from "react";
import { useClientStore } from "../stores/clientStore";

const EditClientPage: React.FC = () => {
  const config = useClientStore((state) => state.config);
  const clientId = useClientStore((state) => state.clientId);
  const updateConfig = useClientStore((state) => state.updateConfig);
  const setClientId = useClientStore((state) => state.setClientId);

  const [formData, setFormData] = useState({
    linkPort: config.linkPort,
    clientPort: config.clientPort,
    clientId: clientId,
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: name.includes("Port") ? parseInt(value) : value,
    };
    setFormData(newFormData);

    const changed =
      newFormData.linkPort !== config.linkPort ||
      newFormData.clientPort !== config.clientPort ||
      newFormData.clientId !== clientId;
    setHasChanges(changed);
  };

  const handleApplyChanges = () => {
    updateConfig({
      linkPort: formData.linkPort,
      clientPort: formData.clientPort,
    });
    setClientId(formData.clientId);
    setHasChanges(false);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 2000);
  };

  return (
    <div className="p-6 bg-black rounded-lg max-w-2xl mx-auto border border-zinc-700 shadow-lg">
      <h2 className="text-white text-xl font-semibold mb-6">Edit Client Details</h2>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-white text-sm font-medium tracking-wide">WebSocket Port</label>
          <input
            type="number"
            name="linkPort"
            className="w-full bg-black text-white rounded px-3 py-2 border border-blue-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200 hover:border-blue-400"
            placeholder="8080"
            value={formData.linkPort}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <label className="text-white text-sm font-medium tracking-wide">Client Port</label>
          <input
            type="number"
            name="clientPort"
            className="w-full bg-black text-white rounded px-3 py-2 border border-blue-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200 hover:border-blue-400"
            placeholder="3000"
            value={formData.clientPort}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <label className="text-white text-sm font-medium tracking-wide">Client ID</label>
          <input
            type="text"
            name="clientId"
            className="w-full bg-black text-white rounded px-3 py-2 border border-blue-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200 hover:border-blue-400"
            placeholder="client-001"
            value={formData.clientId}
            onChange={handleInputChange}
          />
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleApplyChanges}
          disabled={!hasChanges}
          className={`px-6 py-2 rounded font-medium transition-all duration-200 flex items-center space-x-2
            ${
              hasChanges
                ? "bg-blue-600 border border-blue-600 shadow-[0_4px_24px_0_rgba(59,130,246,0.3)] hover:bg-blue-700 text-white transform hover:scale-[1.02]"
                : "bg-gray-700 border border-blue-900 text-gray-400 cursor-not-allowed"
            }`}
        >
          <span>
            {showFeedback ? "Changes Applied!" : "Apply Changes"}
          </span>
          {showFeedback && (
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7"></path>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default EditClientPage;
