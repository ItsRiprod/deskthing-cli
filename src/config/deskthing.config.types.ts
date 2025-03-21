/**
 * Debug level logging.
 */
export type LoggingLevel = "debug" | "info" | "warn" | "error" | "silent";

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type DeskthingConfig = {
  development: DeskThingEmulatorConfig;
};

export type DeskThingEmulatorConfig = {
  /**
   * Logging configuration for the DeskThing server.
   */
  logging: {
    /**
     * The logging level of the server. This is what shows in the console window.
     *
     * @level debug - All logs, including verbose debug logs.
     * @level info - Info, warnings,and errors.
     * @level warn - Warnings and errors.
     * @level error - Only errors.
     * @level silent - No logs besides what your server logs.
     * @default "info"
     */
    level: LoggingLevel;
    /**
     * A prefix for log messages.
     * @default "[DeskThing Server]"
     */
    prefix: string;
  };
  /**
   * Configuration for the DeskThing client.
   */
  client: DeskThingClientConfig;
  /**
   * Configuration for the DeskThing server.
   */
  server: DeskThingServerConfig;
};

export type DeskThingServerConfig = {
  /**
   * The cooldown period in milliseconds before allowing edits.
   * @default 1000
   */
  editCooldownMs: number;
  /**
   * Mocked up data for the server to return to the client.
   * @example 
   * mockData: {
   *  settings: {
   *    setting1: "value1",
   *    setting2: ["value1", "value2"], 
   *  },
   *  input: {
   *    input1: "value1",
   *    input2: ["value1", "value2"], 
   *  }
   *  task: {
   *    task1: "value1",
   *    task2: ["value1", "value2"], 
   *  }
   * }
   */
  mockData?: {
    /**
     * Any mocked up setting data. Used for testing. When settings are defined, these will be returned to your server
     * 
     * Settings are defined like `[settingId]: returnValue`
     * @example
     * ```ts
     * settings: {
     *  setting1: "value1",
     *  setting2: ["value1", "value2"], 
     * }
     * ```
     */
    settings?: Record<string, any>
    input?: Record<string, any>
    task?: Record<string, any>
  };
  /**
   * The interval in seconds at which to refresh the music data. 0 is disabled
   * @default 0
   */
  refreshInterval: number;
};

export type DeskThingClientConfig = {
  /**
   * The port the client will be running on
   * @default 3000
   */
  clientPort: number;
  /**
   * The port the emulator will be running on for the websocket connection
   * @default 8080
   */
  linkPort: number;
  /**
   * The base IP of the Vite development server.
   * @default "http://localhost"
   */
  viteLocation: string;
  /**
   * The port of the Vite development server.
   * @default 5173
   */
  vitePort: number;
  /**
   * Logging configuration for the client.
   */
  logging: {
    /**
     * The logging level of the server. This is what shows in the console window.
     *
     * @level debug - All logs, including verbose debug logs.
     * @level info - Info, warnings,and errors.
     * @level warn - Warnings and errors.
     * @level error - Only errors.
     * @level silent - No logs besides what your server logs.
     * @default "info"
     */
    level: LoggingLevel;
    /**
     * A prefix for log messages.
     * @default "[DeskThing Client]"
     */
    prefix: string;
    /**
     * Whether to enable remote logging. This will bubble client logs into the server logs
     * @warning Not implemented yet
     * @default true
     */
    enableRemoteLogging: boolean;
  };
};
