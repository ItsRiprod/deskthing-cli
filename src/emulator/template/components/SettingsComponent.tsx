import React from "react";
import { SETTING_TYPES, SettingsType } from "@deskthing/types";

type SettingsComponentProps = {
  setting: SettingsType;
  onChange: (id: string, value: unknown) => void;
};

export const SettingsComponent: React.FC<SettingsComponentProps> = ({
  setting,
  onChange,
}) => {
  const renderInput = (setting: SettingsType) => {
    if (setting.disabled)
      return (
        <div className="text-gray-500 bg-gray-800 rounded px-3 py-2 opacity-60">
          {setting.label} (disabled)
        </div>
      );

    switch (setting.type) {
      case SETTING_TYPES.BOOLEAN:
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!setting.value}
              onChange={(e) => onChange(setting.id!, e.target.checked)}
              className="accent-blue-500 w-5 h-5 rounded focus:ring-2 focus:ring-blue-600"
            />
            <span className="text-gray-200">{setting.label}</span>
          </label>
        );
      case SETTING_TYPES.NUMBER:
      case SETTING_TYPES.RANGE:
        return (
          <input
            type="number"
            value={String(setting.value)}
            min={setting.min}
            max={setting.max}
            step={1}
            onChange={(e) => onChange(setting.id!, Number(e.target.value))}
            className="bg-gray-900 text-gray-100 border border-gray-700 rounded px-3 py-2 w-full focus:outline-none focus:border-blue-500"
          />
        );
      case SETTING_TYPES.STRING:
        return (
          <input
            type="text"
            value={String(setting.value ?? "")}
            maxLength={setting.maxLength}
            onChange={(e) => onChange(setting.id!, e.target.value)}
            className="bg-gray-900 text-gray-100 border border-gray-700 rounded px-3 py-2 w-full focus:outline-none focus:border-blue-500"
          />
        );
      case SETTING_TYPES.SELECT:
        return (
          <select
            value={String(setting.value ?? "")}
            onChange={(e) => onChange(setting.id!, e.target.value)}
            className="bg-gray-900 text-gray-100 border border-gray-700 rounded px-3 py-2 w-full focus:outline-none focus:border-blue-500"
          >
            {setting.placeholder && (
              <option value="">{setting.placeholder}</option>
            )}
            {setting.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case SETTING_TYPES.MULTISELECT:
        return (
          <select
            multiple
            value={Array.isArray(setting.value) ? setting.value : []}
            onChange={(e) =>
              onChange(
                setting.id!,
                Array.from(e.target.selectedOptions, (o) => o.value)
              )
            }
            className="bg-gray-900 text-gray-100 border border-gray-700 rounded px-3 py-2 w-full focus:outline-none focus:border-blue-500"
          >
            {setting.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case SETTING_TYPES.LIST:
        return (
          <div>
            {(Array.isArray(setting.value) ? setting.value : []).map(
              (val, idx) => (
                <div key={idx} className="flex items-center mb-2 gap-2">
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => {
                      const newList = [...(setting.value as string[])];
                      newList[idx] = e.target.value;
                      onChange(setting.id!, newList);
                    }}
                    className="bg-gray-900 text-gray-100 border border-gray-700 rounded px-3 py-2 flex-1 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newList = [...(setting.value as string[])];
                      newList.splice(idx, 1);
                      onChange(setting.id!, newList);
                    }}
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                  >
                    Remove
                  </button>
                </div>
              )
            )}
            <button
              type="button"
              onClick={() => {
                const newList = Array.isArray(setting.value)
                  ? [...setting.value, ""]
                  : [""];
                onChange(setting.id!, newList);
              }}
              disabled={
                setting.maxValues &&
                Array.isArray(setting.value) &&
                setting.value.length >= setting.maxValues
              }
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-700 transition"
            >
              Add
            </button>
          </div>
        );
      case SETTING_TYPES.RANKED:
        return (
          <div>
            {(Array.isArray(setting.value) ? setting.value : []).map(
              (val, idx) => (
                <div key={idx} className="flex items-center mb-2 gap-2">
                  <span className="flex-1 text-gray-200">{val}</span>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => {
                      const arr = [...(setting.value as string[])];
                      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                      onChange(setting.id!, arr);
                    }}
                    className="px-2 py-1 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 disabled:opacity-50 transition"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={idx === (setting.value as string[]).length - 1}
                    onClick={() => {
                      const arr = [...(setting.value as string[])];
                      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                      onChange(setting.id!, arr);
                    }}
                    className="px-2 py-1 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 disabled:opacity-50 transition"
                  >
                    ↓
                  </button>
                </div>
              )
            )}
          </div>
        );
      case SETTING_TYPES.COLOR:
        return (
          <input
            type="color"
            value={String(setting.value ?? "#000000")}
            onChange={(e) => onChange(setting.id!, e.target.value)}
            className="h-8 w-16 rounded border border-gray-700 bg-gray-900"
          />
        );
      default:
        return (
          <input
            type="text"
            value={String((setting as any).value)}
            onChange={(e) => onChange((setting as any).id!, e.target.value)}
            className="bg-gray-900 text-gray-100 border border-gray-700 rounded px-3 py-2 w-full focus:outline-none focus:border-blue-500"
          />
        );
    }
  };

  return (
    <div className="mb-6 bg-gray-900 rounded-lg p-4 shadow-lg border border-gray-800">
      <label className="block font-semibold mb-1 text-gray-100">
        {setting.label}
        {setting.description && (
          <span className="ml-2 text-gray-400 text-sm">
            {setting.description}
          </span>
        )}
      </label>
      <div>{renderInput(setting)}</div>
    </div>
  );
};
