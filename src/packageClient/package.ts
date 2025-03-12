import { join, resolve } from "path";
import zl from "zip-lib";
import { readdir, stat, cp, rm } from "fs/promises";
import { loadConfigs } from "./config";
import { build as buildVite } from "vite";

async function buildClient() {
  await buildVite({
    configFile: "vite.config.ts",
    base: "./",
  });
}

async function addFilesToArchive(
  archive: zl.Zip,
  folderPath: string,
  baseFolder = ""
) {
  const exists = await stat(folderPath).catch(() => false);
  if (!exists) return;

  const files = await readdir(folderPath);

  for (const file of files) {
    const filePath = join(folderPath, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      await addFilesToArchive(archive, filePath, join(baseFolder, file));
    } else {
      await archive.addFile(filePath, join(baseFolder, file));
    }
  }
}
export async function createPackage() {
  const { packageJson, manifestJson } = loadConfigs();

  const packageName = packageJson.name;
  const version = (manifestJson.version || packageJson.version).replaceAll('v', '')
  const distPath = resolve("dist");

  const outputFile = join(distPath, `${packageName}-v${version}.zip`);

  console.log("\x1b[36m%s\x1b[0m", "Zipping to " + outputFile);
  const archive = new zl.Zip();

  console.log("\x1b[33m%s\x1b[0m", "📦 Adding files to archive...");
  await addFilesToArchive(archive, distPath);

  console.log("\x1b[33m%s\x1b[0m", "📝 Writing archive to file...");
  await archive.archive(outputFile);
  console.log("\x1b[32m%s\x1b[0m", "✅ Archive written successfully!");
}

async function clean() {
  const distPath = resolve("dist");
  const files = await readdir(distPath);
  for (const file of files) {
    const filePath = join(distPath, file);
    await rm(filePath, { recursive: true, force: true });
  }
}

export async function buildAll() {
  // Clear all of the files in the dist folder that relate to the build
  console.log("\x1b[33m%s\x1b[0m", "🧹 Clearing dist folder...");
  await clean();

  console.log("\x1b[33m%s\x1b[0m", "🏗️ Building Client...");
  await buildClient();

  console.log("\x1b[33m%s\x1b[0m", "📦 Creating package...");
  await createPackage();

  console.log("\x1b[32m%s\x1b[0m", "✅ Build completed successfully!");
}
