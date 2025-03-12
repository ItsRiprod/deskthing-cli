import { ServerService } from "./serverService";
import { ServerMessageBus } from "./serverMessageBus";
import { Logger } from "../services/logger";
import { AppSettings, LOGGING_LEVELS, SEND_TYPES, SETTING_TYPES, SettingsType } from "@deskthing/types"
import { DeskThingConfig } from "../../config/deskthing.config"
import { exec } from 'child_process'

type HandlerFunction = (
  app: string,
  appData: { type: string; request: string; payload: any }
) => void;
type TypeHandler = {
  [key in SEND_TYPES]: RequestHandler;
};
type RequestHandler = {
  [key: string]: HandlerFunction;
};

const serverService = new ServerService();

let Data: {
  data: { [key: string]: any };
  settings: AppSettings
} = {
  data: {},
  settings: {},
};

export const getServerData = () => Data;

export const handleDataFromApp = async (
  app: string,
  appData: any
): Promise<void> => {

  if (Object.values(SEND_TYPES).includes(appData.type as SEND_TYPES)) {
    try {
      const handler = handleData[appData.type as SEND_TYPES] || handleData.default;
      const requestHandler = handler[appData.request || 'default'] || handler.default;
      requestHandler(app, appData as any);
    } catch (error) {
      Logger.error("Error in handleDataFromApp:", error);
    }
  } else {
    Logger.error("Unknown event type:", appData.type, ' with request ', appData.request);
  }
};
/**
 * Logs a warning message when an app sends an unknown data type or request.
 *
 * @param {string} app - The name of the app that sent the unknown data.
 * @param {FromAppData} appData - The data received from the app.
 */
const handleRequestMissing: HandlerFunction = (
  app: string,
  appData: any
) => {
  Logger.warn(
    `[handleComs]: App ${app} sent unknown data type: ${
      appData.type
    } and request: ${appData.request}, with payload ${
      appData.payload
        ? JSON.stringify(appData.payload).length > 1000
          ? "[Large Payload]"
          : JSON.stringify(appData.payload)
        : "undefined"
    }`,
    app
  );
};

const handleRequestSetSettings: HandlerFunction = async (app, appData) => {
  Logger.info("Simulating adding settings");
  Logger.debug("Settings being added: ", appData.payload);
  const appSettings = appData.payload as AppSettings
  const rebuiltSettings: AppSettings = Object.fromEntries(Object.entries(appSettings).map(([key, setting]) => {
    return [key, {
      ...setting,
      value: DeskThingConfig.development?.server?.mockData?.settings[key] || setting.value
    }]
  }))
  Logger.debug('Rebuilt Settings with mocked data. Setting to: ', rebuiltSettings)
  Data.settings = {  ...Data.settings, ...rebuiltSettings }

  // Simulate loading before settings are "submitted" and sent back
  await new Promise(resolve => setTimeout(resolve, 5000));
  Logger.debug('Sending settings back to the server')
  ServerMessageBus.notify("app:data", { type: "settings", payload: rebuiltSettings });

};

const handleRequestSetData: HandlerFunction = async (app, appData) => {
  Logger.info("Simulating adding data");
  Logger.debug("Data being added: ", Data.data);
  Data.data = { ...Data.data, ...appData.payload };
};

/**
 * Handles a request to set data for an app.
 *
 * @param {string} app - The name of the app requesting the data set.
 * @param {any} appData - The payload data to be set.
 * @returns {Promise<void>} - A Promise that resolves when the data has been set.
 */
const handleRequestSet: HandlerFunction = async (
  app: string,
  appData
): Promise<void> => {
  if (!appData.payload) return;
  const { settings, ...data } = appData.payload;

  Data = {
    data: { ...Data.data, ...data },
    settings: { ...Data.settings, ...settings },
  };
};

/**
 * Handles a request to open an authentication window.
 *
 * @param {any} appData - The payload data containing information for the authentication window.
 * @returns {Promise<void>} - A Promise that resolves when the authentication window has been opened.
 */
const handleRequestOpen: HandlerFunction = async (_app, appData) => {
  Logger.debug(`[handleOpen]: Opening ${appData.payload}`);
  
  const encodedUrl = encodeURI(appData.payload);
  
  try {
    if (process.platform === 'win32') {
      // For Windows, use the shell option to avoid command line parsing issues
      exec(`start "" "${encodedUrl}"`);
    } else if (process.platform === 'darwin') {
      exec(`open '${encodedUrl}'`);
    } else {
      exec(`xdg-open '${encodedUrl}'`);
    }
    Logger.debug(`URL opening command executed successfully`);
  } catch (error) {
    Logger.error(`Error opening URL: ${error.message}`);
  }
};

/**
 * Handles a request to log data from an app.
 *
 * @param {string} app - The name of the app that sent the log request.
 * @param {FromAppData} appData - The data received from the app, including the log type and payload.
 * @returns {void}
 */
const handleRequestLog: HandlerFunction = (app, appData) => {
  Logger.clientLog(appData.request as any, appData.payload);
};
/**
 * Handles a request to add a new key to the key map store.
 *
 * @param {string} app - The name of the app requesting the key addition.
 * @param {any} appData - The payload data containing the key information to be added.
 * @returns {Promise<void>} - A Promise that resolves when the key has been added.
 */
const handleRequestKeyAdd: HandlerFunction = async (
  app,
  appData
): Promise<void> => {
  Logger.warn("Key data isn't supported");
  Logger.debug('Received', appData.payload)
};
/**
 * Handles a request to remove a key from the key map store.
 *
 * @param {string} app - The name of the app requesting the key removal.
 * @param {any} appData - The payload data containing the ID of the key to be removed.
 * @returns {Promise<void>} - A Promise that resolves when the key has been removed.
 */
const handleRequestKeyRemove: HandlerFunction = async (
  app,
  appData
): Promise<void> => {
  Logger.warn("Key data isn't supported");
  Logger.debug('Received', appData.payload)
};
/**
 * Handles a request to trigger a key in the key map store.
 *
 * @param {string} app - The name of the app requesting the key trigger.
 * @param {any} appData - The payload data containing the ID and mode of the key to be triggered.
 * @returns {Promise<void>} - A Promise that resolves when the key has been triggered.
 */
const handleRequestKeyTrigger: HandlerFunction = async (
  app,
  appData
): Promise<void> => {
  Logger.warn("Key data isn't supported");
  Logger.debug('Received', appData.payload)
};
/**
 * Handles a request to run an action in the key map store.
 *
 * @param {string} app - The name of the app requesting the action run.
 * @param {any} appData - The payload data containing the ID of the action to be run.
 * @returns {Promise<void>} - A Promise that resolves when the action has been run.
 */
const handleRequestActionRun: HandlerFunction = async (
  app,
  appData
): Promise<void> => {
  Logger.warn("Action data isn't supported");
  Logger.debug('Received', appData.payload)
};
/**
 * Handles a request to update the icon of an action in the key map store.
 *
 * @param {string} app - The name of the app requesting the action icon update.
 * @param {any} appData - The payload data containing the ID of the action and the new icon.
 * @returns {Promise<void>} - A Promise that resolves when the action icon has been updated.
 */
const handleRequestActionUpdate: HandlerFunction = async (
  app,
  appData
): Promise<void> => {
  Logger.warn("Action data isn't supported");
  Logger.debug('Received', appData.payload)
};
/**
 * Handles a request to remove an action from the key map store.
 *
 * @param {string} app - The name of the app requesting the action removal.
 * @param {any} appData - The payload data containing the ID of the action to be removed.
 * @returns {Promise<void>} - A Promise that resolves when the action has been removed.
 */
const handleRequestActionRemove: HandlerFunction = async (
  app,
  appData
): Promise<void> => {
  Logger.warn("Action data isn't supported");
  Logger.debug('Received', appData.payload)
};
/**
 * Handles a request to add a new action to the key map store.
 *
 * @param {string} app - The name of the app requesting the action addition.
 * @param {any} appData - The payload data containing the details of the action to be added.
 * @returns {Promise<void>} - A Promise that resolves when the action has been added.
 */
const handleRequestActionAdd: HandlerFunction = async (
  app,
  appData
): Promise<void> => {
  Logger.warn("Action data isn't supported");
  Logger.debug('Received', appData.payload)
};

/**
 * Handles a request to retrieve data for a specific app.
 *
 * @param {string} app - The name of the app requesting the data.
 * @returns {Promise<void>} - A Promise that resolves when the data has been sent to the app.
 */
const handleRequestGetData: HandlerFunction = async (app): Promise<void> => {
  Logger.info(`[handleAppData]: App is requesting data`);
  Logger.debug(`[handleAppData]: Returning Data:`, Data.data);
  ServerMessageBus.notify("app:data", { type: "data", payload: Data.data });
};

/**
 * Handles a request to delete data for a specific app.
 *
 * @param {string} app - The name of the app requesting the settings.
 * @returns {Promise<void>} - A Promise that resolves when the settings have been sent to the app.
 */
const handleRequestDelData: HandlerFunction = async (
  app,
  appData
): Promise<void> => {
  Logger.info(
    `[handleAppData]: ${app} is deleting data: ${appData.payload.toString()}`
  );
  if (
    !appData.payload ||
    (typeof appData.payload !== "string" && !Array.isArray(appData.payload))
  ) {
    Logger.info(
      `[handleAppData]: Cannot delete data because ${appData.payload.toString()} is not a string or string[]`
    );
    return;
  }
  Data.data = Object.fromEntries(
    Object.entries(Data.data).filter(([key]) => !appData.payload.includes(key))
  );
};

const handleRequestGetConfig: HandlerFunction = async (app): Promise<void> => {
  ServerMessageBus.notify("app:data", { type: "config", payload: {} });
  Logger.warn(
    `[handleAppData]: ${app} tried accessing "Config" data type which is depreciated and no longer in use!`
  );
};

/**
 * Handles a request to retrieve the settings for a specific app.
 *
 * @param {string} app - The name of the app requesting the settings.
 * @returns {Promise<void>} - A Promise that resolves when the settings have been sent to the app.
 */
const handleRequestGetSettings: HandlerFunction = async (
  app
): Promise<void> => {
  Logger.info(
    `[handleAppData]: App is requesting settings`
  );
  Logger.debug(`[handleAppData]: Returning Settings:`, Data.settings);
  ServerMessageBus.notify("app:data", {
    type: "settings",
    payload: Data.settings,
  });
};

/**
 * Handles a request to delete settings for a specific app.
 *
 * @param {string} app - The name of the app requesting the settings.
 * @returns {Promise<void>} - A Promise that resolves when the settings have been sent to the app.
 */
const handleRequestDelSettings: HandlerFunction = async (
  app,
  appData
): Promise<void> => {
  Logger.info(
    `[handleAppData]: ${app} is deleting settings: ${appData.payload.toString()}`
  );
  if (
    !appData.payload ||
    (typeof appData.payload !== "string" && !Array.isArray(appData.payload))
  ) {
    Logger.warn(
      `[handleAppData]: Cannot delete settings because ${appData.payload.toString()} is not a string or string[]`
    );
    return;
  }
  Data.data = Object.fromEntries(
    Object.entries(Data.settings).filter(
      ([key]) => !appData.payload.includes(key)
    )
  );
};

/**
 * Handles a request to retrieve input data for a specific app.
 *
 * This function sends an IPC message to the renderer process to display a form and request user data. Once the user data is received, it is sent back to the app via a message.
 *
 * @param {string} app - The name of the app requesting the input data.
 * @param {object} appData - Additional data associated with the request.
 * @returns {Promise<void>} - A Promise that resolves when the input data has been sent to the app.
 */
const handleRequestGetInput: HandlerFunction = async (app, appData) => {
  const templateData = Object.keys(appData.payload).reduce((acc, key) => {
    acc[key] = "arbData";
    return acc;
  }, {});
  Logger.info(`[handleAppData]: App is requesting input`);
  Logger.debug(`[handleAppData]: Returning Input:`, templateData);
  ServerMessageBus.notify("app:data", { type: "input", payload: templateData });
};

const handleGet = {
  data: handleRequestGetData,
  config: handleRequestGetConfig,
  settings: handleRequestGetSettings,
  input: handleRequestGetInput,
};
const handleSet: RequestHandler = {
  settings: handleRequestSetSettings,
  data: handleRequestSetData,
  default: handleRequestSet,
};
const handleDelete: RequestHandler = {
  settings: handleRequestDelSettings,
  data: handleRequestDelData,
};
const handleOpen: RequestHandler = {
  default: handleRequestOpen,
};
const handleSendToClient: RequestHandler = {
  default: async (app, appData): Promise<void> => {
    serverService.sendToClient({
      app: appData.payload.app || app,
      type: appData.payload.type || "",
      payload: appData.payload.payload || "",
      request: appData.payload.request || "",
    });
  },
};
const handleSendToApp: RequestHandler = {
  default: async (app, appData): Promise<void> => {
    Logger.info("Sent data ", appData.payload, " to other app");
  },
};

const handleLog: RequestHandler = {
  [LOGGING_LEVELS.LOG]: handleRequestLog,
  [LOGGING_LEVELS.DEBUG]: handleRequestLog,
  [LOGGING_LEVELS.ERROR]: handleRequestLog,
  [LOGGING_LEVELS.FATAL]: handleRequestLog,
  [LOGGING_LEVELS.WARN]: handleRequestLog,
  [LOGGING_LEVELS.MESSAGE]: handleRequestLog,
  default: handleRequestMissing,
};
const handleKey: RequestHandler = {
  add: handleRequestKeyAdd,
  remove: handleRequestKeyRemove,
  trigger: handleRequestKeyTrigger,
  default: handleRequestMissing,
};
const handleAction: RequestHandler = {
  add: handleRequestActionAdd,
  remove: handleRequestActionRemove,
  update: handleRequestActionUpdate,
  run: handleRequestActionRun,
  default: handleRequestMissing,
};
const handleDefault: RequestHandler = {
  default: handleRequestMissing,
};

const handleData: TypeHandler = {
  get: handleGet,
  set: handleSet,
  delete: handleDelete,
  open: handleOpen,
  send: handleSendToClient,
  toApp: handleSendToApp,
  log: handleLog,
  key: handleKey,
  action: handleAction,
  default: handleDefault,
  step: { default: () => {} },
  task: { default: () => {} }
};

/**
 * Handles a request for authentication data from an app.
 *
 * @deprecated - This function is deprecated and will be removed in a future version.
 * @param {string} appName - The name of the app requesting authentication data.
 * @param {string[]} scope - The scope of the authentication request (This is also what the user will be prompted with and how it will be saved in the file).
 */
export async function requestUserInput(
  appName: string,
  scope: any
): Promise<void> {
  const scopeData = Object.keys(scope).reduce(
    (acc, key) => ({ ...acc, [key]: "placeholder-value" }),
    {}
  );
  ServerMessageBus.notify("app:data", {
    type: "input",
    payload: { scope: scopeData },
    request: "",
  });
}
