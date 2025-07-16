import { Logger } from "./logger";
import { ServerMessageBus } from "../server/serverMessageBus";
import { AppSettings, DESKTHING_DEVICE } from "@deskthing/types";

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
    return this.currentSettings;
  }

  static setSettings(settings: AppSettings) {
    this.currentSettings = settings;
    this.sendSettings();
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
