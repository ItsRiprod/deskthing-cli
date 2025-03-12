import { DeskThingClientConfig } from "../../config/deskthing.config.types"

export let clientConfig: DeskThingClientConfig = {
    clientPort: 3000,
    linkPort: 8080,
    logging: {
      level: undefined,
      prefix: '[DeskThing Client]',
      enableRemoteLogging: true
    },
    vitePort: 5173,
    viteLocation: 'http://localhost'
  };
  
  export class ClientConfig {
    static getConfig() {
      return clientConfig;
    }
  
    static updateConfig(newConfig: DeskThingClientConfig) {
      // Deep merge the new config with the existing config
      clientConfig = {
        ...clientConfig,
        ...newConfig,
        logging: {
          ...clientConfig.logging,
          ...(newConfig.logging || {})
        }
      };
    }
  }