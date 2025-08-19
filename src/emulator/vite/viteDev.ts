import { InlineConfig, PreviewServer, ViteDevServer as ViteServer } from "vite";
import { Logger } from "../services/logger";
import { join } from "node:path";

export class ViteDevServer {
  private server: ViteServer | PreviewServer | null = null;

  async start(legacy: boolean = false, vitePort: number): Promise<void> {
    try {
      Logger.info(
        `Starting Vite dev server ${
          legacy ? "with" : "without"
        } legacy plugin injection...`
      );

      // Set environment variables to help plugins coordinate
      process.env.VITE_LEGACY_DEV = "true";
      process.env.NODE_ENV = process.env.NODE_ENV || "development";

      const { createServer, build, preview, loadConfigFromFile } = await import(
        "vite"
      );
      const viteLegacyPlugin = await import("@vitejs/plugin-legacy").then(
        (m) => m.default
      );

      // Load the user's existing vite configuration
      const configEnv = { command: "serve" as const, mode: "development" };
      const configResult = await loadConfigFromFile(
        configEnv,
        undefined,
        process.cwd()
      );

      let userConfig = configResult?.config || {};

      const legacyBuildPath = join(process.cwd(), "dist-legacy");

      // Check if legacy plugin already exists
      const existingPlugins = userConfig.plugins || [];
      const pluginNames = existingPlugins
        .map((plugin: any) => {
          if (typeof plugin === "object" && plugin?.name) {
            return plugin.name;
          }
          return null;
        })
        .filter(Boolean);

      const hasLegacyPlugin = pluginNames.includes("vite:legacy");

      // Only add legacy plugin if it doesn't already exist
      const finalPlugins =
        hasLegacyPlugin || !legacy
          ? existingPlugins
          : [
              ...existingPlugins,
              viteLegacyPlugin({
                targets: ["Chrome 69"],
                modernTargets: ["Chrome 69"], // Force modern chunks to also target Chrome 69
                polyfills: true, // Enable polyfills
                additionalLegacyPolyfills: [
                  "regenerator-runtime/runtime",
                  "core-js/stable",
                ],
                modernPolyfills: true, // Enable modern polyfills too
                renderLegacyChunks: true, // Generate legacy chunks
                renderModernChunks: false, // Disable modern chunks since we're targeting Chrome 69
                externalSystemJS: false,
              }),
            ];

      // Create configuration that merges user config with our legacy plugin
      const mergedConfig: InlineConfig = {
        ...userConfig,
        plugins: finalPlugins,
        server: {
          ...userConfig.server,
          host: true,
          port: vitePort,
          strictPort: true, // Ensure we use the specified port
          cors: {
            origin: "*", // Allow all origins for development
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: false, // Try without credentials first
            preflightContinue: false,
            optionsSuccessStatus: 204,
          },
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Cross-Origin-Embedder-Policy": "unsafe-none",
            "Cross-Origin-Opener-Policy": "unsafe-none",
          },
        },
        build: {
          outDir: "dist-legacy",
        },
        optimizeDeps: {
          ...userConfig.optimizeDeps,
          force: true, // Force re-bundling to avoid cache issues
        },
      };

      if (legacy) {
        if (hasLegacyPlugin) {
          Logger.info(
            "Legacy plugin already exists in user config, skipping injection"
          );
        } else {
          Logger.info("Injected legacy plugin into user configuration");
        }

        await build(mergedConfig);
        this.server = await preview({
          ...mergedConfig,
          configFile: false, // Prevents Vite from auto-loading vite.config.ts
          root: process.cwd(),
          preview: {
            ...mergedConfig.server,
            port: vitePort,
            strictPort: true, // Ensure we use the specified port
          },
        });
        Logger.info(
          "✅ Vite dev server started with legacy plugin enabled for Chrome 69+ compatibility"
        );

      } else {
        this.server = await createServer({
          ...mergedConfig,
          configFile: false, // Prevents Vite from auto-loading vite.config.ts
          root: process.cwd(),
        });

        // Start the server
        if ("listen" in this.server) await this.server.listen();

        Logger.info(
          "✅ Vite dev server started with legacy plugin enabled for Chrome 69+ compatibility"
        );
      }

      this.server.printUrls();

      const port = this.server.config.server.port

    } catch (error) {
      Logger.error("Failed to start Vite dev server:", error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.server) {
      try {
        await this.server.close();
        this.server = null;
        Logger.info("Vite dev server stopped");
      } catch (error) {
        Logger.error("Error stopping Vite dev server:", error);
      }
    }
  }

  async getPort(): Promise<number> {
    if (!this.server) {
      throw new Error("Vite dev server is not running");
    }
    return this.server.config.server.port;
  }

  getServer() {
    return this.server;
  }
}
