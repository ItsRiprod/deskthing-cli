import { join, resolve } from "path";
import { createRequire } from "module";
import { DeepPartial, DeskthingConfig } from "./deskthing.config.types";
import { readFile, stat } from "fs/promises";
import { pathToFileURL } from "url";
import { existsSync } from "fs"

export function defineConfig(
  config: DeepPartial<DeskthingConfig>
): DeepPartial<DeskthingConfig> {
  return config;
}

const defaultConfig: DeskthingConfig = {
  development: {
    logging: {
      level: "info",
      prefix: "[DeskThing Server]",
    },
    client: {
      logging: {
        level: "info",
        prefix: "[DeskThing Client]",
        enableRemoteLogging: true,
      },
      clientPort: 3000,
      viteLocation: "http://localhost",
      vitePort: 5173,
      linkPort: 8080,
    },
    server: {
      editCooldownMs: 1000,
      refreshInterval: 0,
    },
  },
};

async function loadTsConfig(
  path: string,
  debug: boolean = false
): Promise<any> {
  try {
    const require = createRequire(import.meta.url);

    try {
      require("ts-node/register");
    } catch (e) {
      if (debug) console.log(`ts-node not available, continuing anyway...`);
      // ts-node not available, continue anyway
    }

    try {
      const configModule = require(path);
      return configModule.default || configModule;
    } catch (e) {
      if (debug)
        console.error(
          "\x1b[91mError loading TypeScript config:",
          path,
          e,
          "\x1b[0m"
        );
      throw e;
    }
  } catch (error) {
    if (debug) console.error("\x1b[91mError loading config:", error, "\x1b[0m");
    throw error;
  }
}

const manuallyParseConfig = async (
  path: string,
  debug: boolean = false
): Promise<DeskthingConfig | null> => {
  try {
    if (debug)
      console.log(
        `(debug mode enabled) Manually loading config from ${path} file and parsing manually (may cause errors)`
      );
    const fileContent = await readFile(path, "utf-8");

    // Extract the configuration object from the file content
    const configMatch = fileContent.match(/defineConfig\(([\s\S]*?)\);?\s*$/);
    if (!configMatch) {
      throw new Error("Could not find config definition in file");
    }

    try {
      const configStr = configMatch[1].trim();
      // Remove any trailing commas that might break JSON parsing
      const cleanConfigStr = configStr.replace(/,(\s*[}\]])/g, "$1");
      // Parse as JSON after ensuring it's valid JSON format
      const config = JSON.parse(cleanConfigStr);
      return config;
    } catch (parseError) {
      if (debug)
        console.error("\x1b[91mError parsing config:", parseError, "\x1b[0m");
      throw parseError;
    }
  } catch (e) {
    if (debug)
      console.error(
        "\x1b[91m(debug mode enabled) Error loading config:",
        e,
        "\x1b[0m"
      );
    throw e;
  }
};

const directConfigImport = async (
  path: string,
  debug: boolean = false
): Promise<DeskthingConfig | null> => {
  const tsConfigPath = pathToFileURL(path).href;
  if (debug)
    console.log(
      `(debug mode enabled) Loading config from ${tsConfigPath} file...`
    );

  const configModule = await import(tsConfigPath);
  if (debug) console.log(`Config loaded successfully from ${tsConfigPath}`);
  return configModule.default || configModule;
};

export const getConfigFromFile = async (debug: boolean = false) => {
  try {
    let rootUrl = resolve(process.cwd(), "deskthing.config.ts");

    if (!existsSync(rootUrl)) {
      if (debug) console.log("deskthing.config.ts not found, trying deskthing.config.js");
      rootUrl = resolve(process.cwd(), "deskthing.config.js");
      if (!existsSync(rootUrl)) {
        throw new Error("No config file found (tried both TS and JS files)");
      }
    }

    // try direct config import
    try {
      const config = await directConfigImport(rootUrl, debug);
      return config;
    } catch (importError) {
      // Second attempt: Try to use require with ts-node if direct import fails
      if (debug)
        console.log(`Direct import failed, trying alternative method...`);
    }

    // try loading require
    try {
      const config = await loadTsConfig(rootUrl, debug);
      return config;
    } catch (e) {
      if (debug)
        console.error("\x1b[91mError loading TS config:", e, "\x1b[0m");
    }

    if (debug) console.log("Trying to parse config manually...");

    // try manually parsing config
    try {
      const config = await manuallyParseConfig(rootUrl, debug);
      return config;
    } catch (e) {
      if (debug)
        console.error("\x1b[91mError parsing config manually:", e, "\x1b[0m");
    }
  } catch (e) {
    if (debug)
      console.error(
        "\x1b[91m(debug mode) Error loading config. Does it exist? :",
        e,
        "\x1b[0m"
      );
    return null;
  }
};

export let DeskThingConfig: DeskthingConfig = defaultConfig;

function isObject(item: any): item is Record<string, any> {
  return item && typeof item === "object" && !Array.isArray(item);
}

function deepmerge(target: any, source: any): any {
  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  const output = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (isObject(source[key]) && isObject(target[key])) {
        output[key] = deepmerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
  }

  return output;
}

export const initConfig = async (
  options: { silent?: boolean; debug?: boolean } = {
    silent: false,
    debug: false,
  }
) => {
  try {
    const userConfig = await getConfigFromFile(options.debug);
    DeskThingConfig = deepmerge(defaultConfig, userConfig || {});
    if (!options.silent || options.debug) {
      if (userConfig) {
        console.log(`\n\n\x1b[32m✅ Config Loaded\x1b[0m\n\n`);
      } else {
        console.log(`\n\n\x1b[32m✅ No Config Found, Using Default\x1b[0m`);
        if (options.debug) {
          console.log(
            `\x1b[3m\x1b[90mPath Checked: ${join(
              process.cwd(),
              "deskthing.config.ts"
            )}\x1b[0m\n\n`
          );
        }
      }
    }
  } catch (e) {
    if (options.debug)
      console.error("\x1b[91mError loading config:", e, "\x1b[0m");
  }
};

/**
 * @deprecated - Use {@link DeskThingConfig} instead after calling initConfig in root
 * @returns
 */
export async function getServerConfig(): Promise<DeskthingConfig> {
  if (DeskThingConfig) {
    return DeskThingConfig;
  }
  const userConfig = await getConfigFromFile();
  DeskThingConfig = {
    ...defaultConfig,
    ...(userConfig || {}),
  };
  return DeskThingConfig;
}

/**
 * @deprecated - Use getServerConfig instead
 */
export const serverConfig: DeskthingConfig = {
  ...defaultConfig,
};
