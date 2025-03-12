import { join } from "path";
import { createRequire } from "module";
import { DeepPartial, DeskthingConfig } from "./deskthing.config.types";

export function defineConfig(config: DeepPartial<DeskthingConfig>): DeepPartial<DeskthingConfig> {
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
      console.error("Error loading TypeScript config:", path, e);
      return null;
    }
  } catch (error) {
    console.error("Error loading config:", error);
    return null;
  }
}

export const getConfigFromFile = async () => {
  const tsConfigPath = join(process.cwd(), "deskthing.config.ts");
  try {
    return await loadTsConfig(tsConfigPath);
  } catch (e) {
    return null;
  }
};

export let DeskThingConfig: DeskthingConfig = defaultConfig;

function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item);
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

export const initConfig = async (silent: boolean = false) => {
  const userConfig = await getConfigFromFile();
  DeskThingConfig = deepmerge(defaultConfig, userConfig || {});
  if (!silent) {
    console.log(`\n\n\x1b[32m✅ Config Loaded\x1b[0m\n\n`);
  }
}

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
