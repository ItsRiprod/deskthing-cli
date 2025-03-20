import { join, resolve } from "path";
import { createRequire } from "module";
import { DeepPartial, DeskthingConfig } from "./deskthing.config.types";
import { stat } from "fs/promises";
import { pathToFileURL } from "url"

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

async function loadTsConfig(path: string): Promise<any> {
  try {
    const require = createRequire(import.meta.url);

    try {
      const configModule = require(path);
      return configModule.default || configModule;
    } catch (e) {
      // console.error("Error loading TypeScript config:", path, e);
      return null;
    }
  } catch (error) {
    // console.error("Error loading config:", error);
    return null;
  }
}

export const getConfigFromFile = async (debug: boolean = false) => {
  try {
    const rootUrl = resolve(process.cwd(), "deskthing.config.ts");
    const tsConfigPath = pathToFileURL(rootUrl).href;
    if (debug)
      console.log(
        `(debug mode enabled) Loading config from ${tsConfigPath} file...`
      );

      try {
        const configModule = await import(tsConfigPath);
        if (debug) console.log(`Config loaded successfully from ${tsConfigPath}`);
        return configModule.default || configModule;
      } catch (importError) {
        // Second attempt: Try to use require with ts-node if direct import fails
        if (debug) console.log(`Direct import failed, trying alternative method...`);
        
        try {
          // Use createRequire for ESM compatibility
          const require = createRequire(import.meta.url);
          
          // Try to load ts-node programmatically if available
          try {
            require('ts-node/register');
          } catch (e) {
            // ts-node not available, continue anyway
          }
          
          const configModule = require(rootUrl);
          return configModule.default || configModule;
        } catch (requireError) {
          if (debug) console.error(`All loading methods failed for ${rootUrl}`);
          throw importError; // Throw the original error
        }
      }
  } catch (e) {
    if (debug)
      console.error("\x1b[91m(debug mode) Error loading config. Does it exist? :", e, "\x1b[0m");
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
