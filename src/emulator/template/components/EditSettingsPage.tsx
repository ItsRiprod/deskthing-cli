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
    <div className="p-6 bg-black rounded-lg max-w-2xl mx-auto border border-gray-800 shadow-lg">
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
          className="px-6 py-2 rounded bg-black text-white font-medium border border-emerald-600 shadow-[0_4px_24px_0_rgba(16,185,129,0.3)] hover:bg-gray-900 transition-all duration-200"
          onClick={saveSettings}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default EditSettingsPage;
