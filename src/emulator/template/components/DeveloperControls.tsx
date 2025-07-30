import React, { useState, useCallback } from "react";
import DraggableWrapper from "./DraggableWrapper";
import { useClientStore } from "../stores/clientStore";
import EditSettingsPage from "./EditSettingsPage"; // Import the settings page

const DeveloperControls: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false); // Add state for settings page
  const updateConfig = useClientStore((state) => state.updateConfig);
  const setClientId = useClientStore((state) => state.setClientId);
  const config = useClientStore((state) => state.config);
  const clientId = useClientStore((state) => state.clientId);
  const [hasChanges, setHasChanges] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const [formData, setFormData] = useState({
    linkPort: config.linkPort,
    clientPort: config.clientPort,
    clientId: clientId,
  });

  const handleExpandToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: name.includes("Port") ? parseInt(value) : value,
    };
    setFormData(newFormData);

    const hasChanged =
      newFormData.linkPort !== config.linkPort ||
      newFormData.clientPort !== config.clientPort ||
      newFormData.clientId !== clientId;
    setHasChanges(hasChanged);
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

  const inputClasses =
    "w-full bg-gray-800 text-white rounded px-3 py-2 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-600";
  const labelClasses = "text-white text-sm font-medium tracking-wide";

  return (
    <DraggableWrapper isExpanded={isExpanded} setIsExpanded={setIsExpanded}>
      <div className="w-full flex flex-row-reverse overflow-auto bg-gray-900 rounded-lg shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold text-lg">
              Developer Controls
            </h2>
            <button
              onClick={handleExpandToggle}
              className="text-white hover:text-gray-300 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 transition-all duration-200"
            >
              ×
            </button>
          </div>

          <div className="space-y-6 max-w-2xl mx-auto">
            {/* ...existing controls... */}

            <div className="space-y-2">
              <label className={labelClasses}>WebSocket Port</label>
              <input
                type="number"
                name="linkPort"
                className={inputClasses}
                placeholder="8080"
                value={formData.linkPort}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <label className={labelClasses}>Client Port</label>
              <input
                type="number"
                name="clientPort"
                className={inputClasses}
                placeholder="3000"
                value={formData.clientPort}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <label className={labelClasses}>Client ID</label>
              <input
                type="text"
                name="clientId"
                className={inputClasses}
                placeholder="client-001"
                value={formData.clientId}
                onChange={handleInputChange}
              />
            </div>

            <div className="pt-6 flex border-t border-gray-700">
              <button
                onClick={handleApplyChanges}
                disabled={!hasChanges}
                className={`w-full mr-2 rounded-lg px-4 py-3 font-medium transition-all duration-200 flex items-center justify-center space-x-2
                ${
                  hasChanges
                    ? "bg-green-600 hover:bg-green-700 text-white transform hover:scale-[1.02]"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
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
              <button
                onClick={() => setShowSettings((prev) => !prev)}
                className="w-full rounded-lg px-4 py-3 font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200"
              >
                {showSettings ? "Close Edit Settings" : "Edit Settings"}
              </button>
            </div>
          </div>
        </div>
        {showSettings && (
          <div className="max-h-screen overflow-y-auto">
            <EditSettingsPage />
          </div>
        )}
      </div>
    </DraggableWrapper>
  );
};

export default DeveloperControls;
