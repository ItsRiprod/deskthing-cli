enum SEND_TYPES {
  /**
   * Default handler for unknown or unspecified data types.
   * Will log a warning message about the unknown data type.
   */
  DEFAULT = "default",
  /**
   * Retrieves data from the server. Supports multiple request types:
   * - 'data': Gets app-specific stored data
   * - 'config': Gets configuration (deprecated)
   * - 'settings': Gets application settings
   * - 'input': Requests user input via a form
   *
   * @remarks Use {@link DeskThing.getData}, {@link DeskThing.getConfig}, {@link DeskThing.getSettings}, or {@link DeskThing.getUserInput} instead
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.GET, { request: 'settings' })
   */
  GET = "get",
  /**
   * Sets data inside the server for your app that can be retrieved with DeskThing.getData()
   * Data is stored persistently and can be retrieved later.
   *
   * @remarks Use {@link DeskThing.saveData} instead
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.SET, { payload: { key: 'value' }})
   */
  SET = "set",
  /**
   * Deletes data inside the server for your app that can be retrieved with DeskThing.getData()
   *
   * @remarks Use {@link DeskThing.deleteSettings} or {@link DeskThing.deleteData} instead
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.DELETE, { payload: ['key1', 'key2'] }, "settings")
   * DeskThing.sendData(SEND_TYPES.DELETE, { payload: ['key1', 'key2'] }, "data")
   */
  DELETE = "delete",
  /**
   * Opens a URL to a specific address on the server.
   * This gets around any CORS issues that may occur by opening in a new window.
   * Typically used for authentication flows.
   *
   * @remarks Use {@link DeskThing.openUrl} instead
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.OPEN, { payload: 'https://someurl.com' })
   */
  OPEN = "open",
  /**
   * Sends data to the front end client.
   * Can target specific client components or send general messages.
   * Supports sending to both the main client and specific app clients.
   *
   * @remarks Use {@link DeskThing.send} instead
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.SEND, { type: 'someData', payload: 'value' })
   */
  SEND = "send",
  /**
   * Sends data to another app in the system.
   * Allows inter-app communication by specifying target app and payload.
   * Messages are logged for debugging purposes.
   *
   * @remarks Use {@link DeskThing.sendDataToOtherApp} instead
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.TOAPP, { request: 'spotify', payload: { type: 'get', data: 'music' }})
   */
  TOAPP = "toApp",
  /**
   * Logs messages to the system logger.
   * Supports multiple log levels: DEBUG, ERROR, FATAL, LOGGING, MESSAGE, WARNING
   * Messages are tagged with the source app name.
   *
   * @remarks Use {@link DeskThing.log} instead
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.LOG, { request: 'ERROR', payload: 'Something went wrong' })
   */
  LOG = "log",
  /**
   * Manages key mappings in the system.
   * Supports operations: add, remove, trigger
   * Keys can have multiple modes and are associated with specific apps.
   *
   * @remarks Use {@link DeskThing.registerKeyObject} instead
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.KEY, { request: 'add', payload: { id: 'myKey', modes: ['default'] }})
   */
  KEY = "key",
  /**
   * Manages actions in the system.
   * Supports operations: add, remove, update, run
   * Actions can have values, icons, and version information.
   *
   * @remarks
   * It is recommended to use {@link DeskThing.registerAction} instead of sending data directly.
   *
   * @example
   * DeskThing.sendData(SEND_TYPES.ACTION, { request: 'add', payload: { id: 'myAction', name: 'My Action' }})
   */
  ACTION = "action"
}

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

import { ServerService } from "./serverService";
import { ServerMessageBus } from "./serverMessageBus";
import { Logger, LOGGING_LEVELS } from "../services/logger";

const serverService = new ServerService();

let Data: {
  data: { [key: string]: any };
  settings: any;
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
    Logger.error("Unknown event type:", appData.type);
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
  Logger.log(
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
  Logger.log("Simulating adding settings: ", appData.payload);
  Data.settings = { ...Data.settings, ...appData.payload };
};

const handleRequestSetData: HandlerFunction = async (app, appData) => {
  Logger.log("Simulating adding data", appData.payload);
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
  window.open(appData.payload, "_blank");
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
  Logger.error("Mapping data isnt supported. Received ", appData.payload);
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
  Logger.error("Mapping data isnt supported. Received ", appData.payload);
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
  Logger.error("Mapping data isnt supported. Received ", appData.payload);
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
  Logger.error("Mapping data isnt supported. Received ", appData.payload);
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
  Logger.error("Mapping data isnt supported. Received ", appData.payload);
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
  Logger.error("Mapping data isnt supported. Received ", appData.payload);
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
  Logger.error("Mapping data isnt supported. Received ", appData.payload);
};

/**
 * Handles a request to retrieve data for a specific app.
 *
 * @param {string} app - The name of the app requesting the data.
 * @returns {Promise<void>} - A Promise that resolves when the data has been sent to the app.
 */
const handleRequestGetData: HandlerFunction = async (app): Promise<void> => {
  Logger.log(`[handleAppData]: App is requesting data. Returning:`, Data.data);
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
  Logger.log(
    `[handleAppData]: ${app} is deleting data: ${appData.payload.toString()}`
  );
  if (
    !appData.payload ||
    (typeof appData.payload !== "string" && !Array.isArray(appData.payload))
  ) {
    Logger.log(
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
  Logger.log(
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
  Logger.log(
    `[handleAppData]: App is requesting settings. Returning:`,
    Data.settings
  );
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
  Logger.log(
    `[handleAppData]: ${app} is deleting settings: ${appData.payload.toString()}`
  );
  if (
    !appData.payload ||
    (typeof appData.payload !== "string" && !Array.isArray(appData.payload))
  ) {
    Logger.log(
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
  Logger.log(
    `[handleAppData]: App is requesting input. Returning:`,
    templateData
  );
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
    Logger.log("Sent data ", appData.payload, " to other app");
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
  // step: { default: () => {} },
  // task: { default: () => {} }
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
