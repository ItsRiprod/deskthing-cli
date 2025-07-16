import React from "react";
import { useClientStore } from "../stores/clientStore";
import { SettingsComponent } from "./SettingsComponent";
import { SettingsType } from "@deskthing/types";

const EditSettingsPage: React.FC = () => {
  const settings = useClientStore((state) => state.settings);
  const updateSetting = useClientStore((state) => state.updateSetting);
  const saveSettings = useClientStore((state) => state.saveSettings); // Assume this exists

  // Convert settings object to array for rendering
  const settingsArray: (SettingsType & { id: string })[] = Object.entries(
    settings
  ).map(([id, setting]) => ({
    ...setting,
    id,
  }));

  return (
    <div className="p-6 bg-gray-900 rounded-lg shadow-xl max-w-2xl mx-auto border border-gray-800">
      <h2 className="text-white text-xl font-semibold mb-6">Edit App Settings</h2>
      <div className="space-y-6">
        {settingsArray.length === 0 ? (
          <div className="text-gray-400 text-center">
            No settings available.
          </div>
        ) : (
          settingsArray.map((setting) => (
            <SettingsComponent
              key={setting.id}
              setting={setting}
              onChange={updateSetting}
            />
          ))
        )}
      </div>
      <div className="mt-8 flex justify-end">
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={saveSettings}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default EditSettingsPage;
