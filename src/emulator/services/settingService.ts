import { Logger } from "./logger";
import { ServerMessageBus } from "../server/serverMessageBus";
import { AppSettings, DESKTHING_DEVICE } from "@deskthing/types";
import { deskthingConfig } from "../../config/deskthing.config";

export class SettingService {
  private static currentSettings: AppSettings = {};

  static sendSettings() {
    // send to client
    ServerMessageBus.publish('client:request', {
      type: DESKTHING_DEVICE.SETTINGS,
      payload: this.currentSettings,
      app: 'client'
    })

    // send to app
    ServerMessageBus.notify("app:data", {
      type: "settings",
      payload: this.currentSettings,
    });
  }

  static getSettings(): AppSettings {
    return this.currentSettings || {};
  }

  static async setSettings(appSettings: AppSettings) {

    if (!this.currentSettings) {
      this.currentSettings = {};
    }

    // Shallow merge the new settings into the current settings - prefering the new settings over the old ones
    this.currentSettings = { ...this.currentSettings, ...appSettings };

    // simulate the user "adding settings" and then submitting them based on the config mock data

    const rebuiltSettings: AppSettings = Object.fromEntries(
      Object.entries(appSettings).map(([key, setting]) => {
        return [
          key,
          {
            ...setting,
            value:
              deskthingConfig.development?.server?.mockData?.settings[key] ??
              setting.value,
          },
        ];
      })
    );

    // Update the current settings with the rebuilt settings
    this.currentSettings = { ...this.currentSettings, ...rebuiltSettings };


    await new Promise(resolve => setTimeout(resolve, 1000)); // simulate delay

    Logger.debug(
      "Rebuilt Settings with mocked data. Setting to: ",
      rebuiltSettings
    );

    // now send the updated settings to the server
    this.sendSettings();
  }

  static async initSettings(settings: AppSettings) {
    if (!this.currentSettings) {
      this.currentSettings = {};
    }

    for (const key in settings) {
      const newSetting = settings[key];
      const existingSetting = this.currentSettings[key];

      // If no existing setting, add it
      if (!existingSetting) {
        this.currentSettings[key] = newSetting;
        continue;
      }

      // If new setting has a version
      if (newSetting && typeof newSetting.version !== "undefined") {
        // If versions differ, overwrite
        if (
          !existingSetting.version ||
          existingSetting.version !== newSetting.version
        ) {
          this.currentSettings[key] = newSetting;
        }
        // If versions are the same, keep existing
        // (do nothing)
      } else {
        // If new setting has no version, prefer existing
        // (do nothing)
      }
    }

    this.setSettings(this.currentSettings);
  }

  static delSettings(settingIds: string[]) {
    if (!this.currentSettings) {
      Logger.warn("No settings to delete from");
      return;
    }

    settingIds.forEach(id => {
      delete this.currentSettings[id];
    });

    this.sendSettings();
  }

  static updateSettings(settings: AppSettings) {
    this.currentSettings = { ...this.currentSettings, ...settings };
    this.sendSettings();
  }
}
