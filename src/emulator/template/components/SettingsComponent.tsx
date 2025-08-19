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
        <div className="text-emerald-500 bg-emerald-950 rounded px-3 py-2 opacity-60">
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
              className="accent-emerald-500 w-5 h-5 rounded focus:ring-2 focus:ring-emerald-600"
            />
            <span className="text-emerald-100">{setting.label}</span>
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
            className="bg-emerald-950 text-emerald-100 border border-emerald-700 rounded px-3 py-2 w-full focus:outline-none focus:border-emerald-500"
          />
        );
      case SETTING_TYPES.STRING:
        return (
          <input
            type="text"
            value={String(setting.value ?? "")}
            maxLength={setting.maxLength}
            onChange={(e) => onChange(setting.id!, e.target.value)}
            className="bg-emerald-950 text-emerald-100 border border-emerald-700 rounded px-3 py-2 w-full focus:outline-none focus:border-emerald-500"
          />
        );
      case SETTING_TYPES.SELECT:
        return (
          <select
            value={String(setting.value ?? "")}
            onChange={(e) => onChange(setting.id!, e.target.value)}
            className="bg-emerald-950 text-emerald-100 border border-emerald-700 rounded px-3 py-2 w-full focus:outline-none focus:border-emerald-500"
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
            className="bg-emerald-950 text-emerald-100 border border-emerald-700 rounded px-3 py-2 w-full focus:outline-none focus:border-emerald-500"
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
                    className="bg-emerald-950 text-emerald-100 border border-emerald-700 rounded px-3 py-2 flex-1 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newList = [...(setting.value as string[])];
                      newList.splice(idx, 1);
                      onChange(setting.id!, newList);
                    }}
                    className="px-2 py-1 bg-emerald-700 text-white rounded hover:bg-emerald-800 transition"
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
              className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:bg-emerald-900 transition"
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
                  <span className="flex-1 text-emerald-100">{val}</span>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => {
                      const arr = [...(setting.value as string[])];
                      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                      onChange(setting.id!, arr);
                    }}
                    className="px-2 py-1 bg-emerald-800 text-emerald-100 rounded hover:bg-emerald-700 disabled:opacity-50 transition"
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
                    className="px-2 py-1 bg-emerald-800 text-emerald-100 rounded hover:bg-emerald-700 disabled:opacity-50 transition"
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
            value={String(setting.value ?? "#10b981")}
            onChange={(e) => onChange(setting.id!, e.target.value)}
            className="h-8 w-16 rounded border border-emerald-700 bg-emerald-950"
          />
        );
      default:
        return (
          <input
            type="text"
            value={String((setting as any).value)}
            onChange={(e) => onChange((setting as any).id!, e.target.value)}
            className="bg-emerald-950 text-emerald-100 border border-emerald-700 rounded px-3 py-2 w-full focus:outline-none focus:border-emerald-500"
          />
        );
    }
  };

  return (
    <div className="mb-6 rounded-lg p-4 shadow-lg border border-emerald-800">
      <label className="block font-semibold mb-1 text-emerald-100">
        {setting.label}
        {setting.description && (
          <span className="ml-2 text-emerald-400 text-sm">
            {setting.description}
          </span>
        )}
      </label>
      <div>{renderInput(setting)}</div>
    </div>
  );
};
