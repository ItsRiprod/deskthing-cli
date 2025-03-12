import { join } from "path";
import { resolve } from "path";
import { DeskThingType } from '@deskthing/types'
import { pathToFileURL } from "url";
import { unlink, writeFile } from "fs/promises";

export const sanitizeDeskThing = async () => {
  console.log("\x1b[33m%s\x1b[0m", "🧹 Sanitizing DeskThing Object...");

  const originalConsole = Object.fromEntries(
    Object.entries(console || {}).map(([key, value]) => [key, value || (() => {})])
  );

  if (console) {
    Object.keys(originalConsole).forEach(key => {
      console[key] = () => {};
    });
  }

  try {
    const distPath = resolve("dist");
    const serverDeskthingEntry = join(distPath, "server", "index.js");
    const rootDeskthingEntry = join(distPath, "index.js");
    
    const moduleUrl = pathToFileURL(
      await import('fs/promises').then(fs => 
        fs.access(serverDeskthingEntry)
          .then(() => serverDeskthingEntry)
          .catch(() => rootDeskthingEntry)
      )
    ).href;    
    const packageJsonPath = join(distPath, "server", "package.json");
    await writeFile(packageJsonPath, JSON.stringify({ type: "commonjs" }, null, 2));
    
    const { DeskThing } = (await import(moduleUrl)) as { DeskThing: DeskThingType };
    
    await unlink(packageJsonPath);
    
    if (    
      typeof DeskThing?.toClient !== "function" ||
      typeof DeskThing?.start !== "function" ||
      typeof DeskThing?.stop !== "function" ||
      typeof DeskThing?.purge !== "function" ||
      typeof DeskThing?.getManifest !== "function"
    ) {
      throw new Error("DeskThing must have all required functions: toClient, start, stop, purge, and getManifest");
    }

  } catch (error) {
      throw new Error(`Error sanitizing DeskThing: ${error.message}`);
  } finally {
    if (console) {
      Object.assign(console, originalConsole);
    }
    console.log("\x1b[32m%s\x1b[0m", "✅ DeskThing sanitization completed successfully!");
  }
};