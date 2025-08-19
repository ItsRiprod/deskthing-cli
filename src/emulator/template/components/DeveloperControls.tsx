import React, { useState, useCallback } from "react";
import DraggableWrapper from "./DraggableWrapper";
import EditSettingsPage from "./EditSettingsPage";
import EditClientPage from "./EditClientPage";
import ActionsPage from "./ActionsPage";

const DeveloperControls: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePage, setActivePage] = useState<"settings" | "client" | "actions" | null>(null);

  const handleExpandToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleOpenPage = (page: "settings" | "client" | "actions") => {
    setActivePage((prev) => (prev === page ? null : page));
  };

  return (
    <DraggableWrapper isExpanded={isExpanded} setIsExpanded={setIsExpanded}>
      <div className="flex flex-row-reverse bg-black rounded-lg max-w-2xl mx-auto border border-gray-800 shadow-lg overflow-auto">
        <div className="p-6 w-80 min-w-[20rem] border-r border-gray-800 bg-black">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-xl font-semibold">Developer Controls</h2>
            <button
              onClick={handleExpandToggle}
              className="text-white hover:text-gray-300 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 transition-all duration-200"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => handleOpenPage("client")}
              className={`w-full px-6 py-2 rounded bg-black text-white font-medium border border-blue-600 shadow-[0_4px_24px_0_rgba(59,130,246,0.3)] hover:bg-gray-900 transition-all duration-200 ${
                activePage === "client" ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {activePage === "client" ? "Close Edit Client" : "Edit Client"}
            </button>
            <button
              onClick={() => handleOpenPage("settings")}
              className={`w-full px-6 py-2 rounded bg-black text-white font-medium border border-emerald-600 shadow-[0_4px_24px_0_rgba(16,185,129,0.3)] hover:bg-gray-900 transition-all duration-200 ${
                activePage === "settings" ? "ring-2 ring-emerald-500" : ""
              }`}
            >
              {activePage === "settings" ? "Close Edit Settings" : "Edit Settings"}
            </button>
            <button
              onClick={() => handleOpenPage("actions")}
              className={`w-full px-6 py-2 rounded bg-black text-white font-medium border border-purple-600 shadow-[0_4px_24px_0_rgba(168,85,247,0.3)] hover:bg-gray-900 transition-all duration-200 ${
                activePage === "actions" ? "ring-2 ring-purple-500" : ""
              }`}
            >
              {activePage === "actions" ? "Close Utilities" : "Developer Utilities"}
            </button>
          </div>
        </div>
        <div className="flex-1 max-h-screen overflow-y-auto p-6">
          {activePage === "settings" && <EditSettingsPage />}
          {activePage === "client" && <EditClientPage />}
          {activePage === "actions" && <ActionsPage />}
        </div>
      </div>
    </DraggableWrapper>
  );
};

export default DeveloperControls;
