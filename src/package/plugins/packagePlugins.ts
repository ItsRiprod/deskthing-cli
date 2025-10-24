import path from "path";
import { build } from "esbuild";
import fs from "fs/promises";
import crypto from "crypto";
import { PluginManifest, PluginApplications } from "@deskthing/types";
import { testAdbPlugin, testBluetoothPlugin, testClientPlugin, testServerPlugin } from "./testPlugins";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'plugins');
const OUT_DIR = path.join(ROOT, 'dist', 'plugins');

const hashFile = async (filePath: string) => {
    const buf = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256').update(buf).digest('base64');
    return `sha256-${hash}`;
};

const ensureDir = (p: string) => fs.mkdir(p, { recursive: true });

async function buildPlugin(pluginName: string) {
    const srcRoot = path.join(SRC_DIR, pluginName);
    const manifestPath = path.join(srcRoot, 'manifest.json');
    const manifestRaw = await fs.readFile(manifestPath, 'utf8');
    const manifest: PluginManifest = JSON.parse(manifestRaw);

    const outRoot = path.join(OUT_DIR, pluginName);
    await ensureDir(outRoot);

    // Helper to resolve candidate entry file (manifest.module or index.ts/js)
    const resolveEntry = async (folderName: PluginApplications, fileName?: string) => {
        if (fileName) {
            const p = path.join(srcRoot, folderName, fileName);
            if (await fs.stat(p).then(s => s.isFile()).catch(() => false)) return p;
        }
        for (const fallback of ['index.ts', 'index.js', 'index.mjs']) {
            const p = path.join(srcRoot, folderName, fallback);
            if (await fs.stat(p).then(s => s.isFile()).catch(() => false)) return p;
        }
        return null;
    };

    if (!manifest.entrypoints) {
        throw new Error(`No entrypoints defined in manifest for plugin ${pluginName}`);
    }

    // Build server module (if server.module)
    const integrity: Record<string, string> = {};
    if (manifest.entrypoints[PluginApplications.SERVER]?.fileName) {
        const src = await resolveEntry(PluginApplications.SERVER, manifest.entrypoints[PluginApplications.SERVER].fileName);

        if (!src) throw new Error(`server.fileName not found for plugin ${pluginName}`);

        const outDir = path.join(outRoot, 'server');
        await ensureDir(outDir);
        const outfile = path.join(outDir, 'index.mjs');
        await build({
            entryPoints: [src],
            bundle: true,
            platform: 'node',
            target: ['node16'],
            format: 'esm',
            outfile,
            sourcemap: false,
            minify: process.env.NODE_ENV === 'production',
            external: [], // tune as needed
        });

        await testServerPlugin(outfile); // throws if it fails the test

        manifest.entrypoints[PluginApplications.SERVER].fileName = 'index.mjs';

        integrity[PluginApplications.SERVER] = await hashFile(outfile);
    }

    // Build client module (if client.module)
    if (manifest.entrypoints[PluginApplications.CLIENT]?.fileName) {
        const src = await resolveEntry(PluginApplications.CLIENT, manifest.entrypoints[PluginApplications.CLIENT].fileName);
        if (!src) throw new Error(`client.fileName not found for plugin ${pluginName}`);
        const outDir = path.join(outRoot, 'client');
        await ensureDir(outDir);
        const outfile = path.join(outDir, 'index.mjs');
        await build({
            entryPoints: [src],
            bundle: true,
            platform: 'browser',
            target: ['es2020'],
            format: 'esm',
            outfile,
            sourcemap: false,
            minify: process.env.NODE_ENV === 'production',
        });

        await testClientPlugin(outfile); // throws if it fails the test

        manifest.entrypoints[PluginApplications.CLIENT].fileName = 'index.mjs';

        integrity[PluginApplications.CLIENT] = await hashFile(outfile);
    }

    // Build ADB module (if adb.module)
    if (manifest.entrypoints[PluginApplications.ADB]?.fileName) {
        const src = await resolveEntry(PluginApplications.ADB, manifest.entrypoints[PluginApplications.ADB].fileName);
        if (!src) throw new Error(`adb.fileName not found for plugin ${pluginName}`);
        const outDir = path.join(outRoot, 'adb');
        await ensureDir(outDir);
        const outfile = path.join(outDir, 'index.mjs');
        await build({
            entryPoints: [src],
            bundle: true,
            platform: 'node',
            target: ['node16'],
            format: 'esm',
            outfile,
            sourcemap: false,
            minify: process.env.NODE_ENV === 'production',
            external: [], // tune as needed
        });

        await testAdbPlugin(outfile); // throws if it fails the test

        manifest.entrypoints[PluginApplications.ADB].fileName = 'index.mjs'

        integrity[PluginApplications.ADB] = await hashFile(outfile);
    }

    // Build BLUETOOTH module (if bluetooth.module)
    if (manifest.entrypoints[PluginApplications.BLUETOOTH]?.fileName) {
        const src = await resolveEntry(PluginApplications.BLUETOOTH, manifest.entrypoints[PluginApplications.BLUETOOTH].fileName);
        if (!src) throw new Error(`bluetooth.fileName not found for plugin ${pluginName}`);
        const outDir = path.join(outRoot, 'bluetooth');
        await ensureDir(outDir);
        const outfile = path.join(outDir, 'index.mjs');
        await build({
            entryPoints: [src],
            bundle: true,
            platform: 'node',
            target: ['node16'],
            format: 'esm',
            outfile,
            sourcemap: false,
            minify: process.env.NODE_ENV === 'production',
            external: [], // tune as needed
        });

        await testBluetoothPlugin(outfile); // throws if it fails the test

        manifest.entrypoints[PluginApplications.BLUETOOTH].fileName = 'index.mjs'

        integrity[PluginApplications.BLUETOOTH] = await hashFile(outfile);
    }

    // Copy assets
    if (await fs.stat(path.join(srcRoot, 'assets')).then(s => s.isDirectory()).catch(() => false)) {
        const outAssets = path.join(outRoot, 'assets');
        await fs.rm(outAssets, { recursive: true, force: true }).catch(() => { });
        await fs.cp(path.join(srcRoot, 'assets'), outAssets, { recursive: true });
    }

    // Write finalized manifest with pkg.root and integrity
    manifest.pkg = manifest.pkg || {};
    manifest.pkg.root = './';
    manifest.pkg.integrity = integrity;
    await fs.writeFile(path.join(outRoot, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

    console.log("\x1b[36m%s\x1b[0m", `Built plugin ${pluginName} -> ${outRoot}`);
}

export async function buildPlugins() {
    try {
        await fs.stat(SRC_DIR);
    } catch (e) {
        console.warn("\x1b[35mUnable to find plugins folder\x1b[0m");
        console.warn("\x1b[90m(Can be ignored if you do not have any plugins)\x1b[0m");
        return;
    }

    try {
        const entries = await fs.readdir(SRC_DIR, { withFileTypes: true });
        const pluginDirs = entries.filter(e => e.isDirectory()).map(d => d.name);
        if (pluginDirs.length === 0) {
            console.warn('No plugins found in plugins directory');
            return;
        }
        for (const p of pluginDirs) {
            try {
                await buildPlugin(p);
            } catch (err) {
                console.error(`Failed building ${p}:`, (err as Error).message);
                // delete the partially built plugin folder
                await fs.rm(path.join(OUT_DIR, p), { recursive: true, force: true }).catch(() => { });
            }
        }
    } catch (err) {
        console.error('Error building plugins:', (err as Error).message);
    }
}