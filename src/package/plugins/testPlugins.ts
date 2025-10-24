/**
 * Tests whether a plugin module at the given path exports the required
 * functions for the specified plugin type. These functions are not invoked,
 * only checked for presence and type.
 */

import { ClientPluginModule } from "@deskthing/types";

/**
 * Helper: dynamically import a module path and return the exported object that
 * should implement the plugin interface. Accepts either a default export or a
 * module that directly exports the plugin object.
 */
async function loadPluginModule(path: string): Promise<any> {
    try {
        const mod = await import(path);
        return mod.default ?? mod;
    } catch (err) {
        throw new Error(`Failed to import plugin at "${path}": ${(err as Error).message}`);
    }
}

/**
 * Test a server plugin module for required functions (without invoking them).
 * Throws on failure; resolves on success.
 */
export const testServerPlugin = async (serverPluginPath: string): Promise<void> => {
    const plugin = await loadPluginModule(serverPluginPath);
    if (!plugin || typeof plugin.install !== 'function') {
        throw new Error(`Server plugin at "${serverPluginPath}" must export an 'install' function`);
    }
}

/**
 * Test a client plugin module for required functions (without invoking them).
 * Expects a default export conforming to ClientPluginInterface.
 */
export const testClientPlugin = async (clientPluginPath: string): Promise<void> => {
    const mod = await import(clientPluginPath);
    const pluginModule: ClientPluginModule | undefined = mod as any;
    if (!pluginModule || !pluginModule.default) {
        throw new Error(`Client plugin at "${clientPluginPath}" must have a default export`);
    }
    const plugin = pluginModule.default;
    if (typeof plugin.mount !== 'function') {
        throw new Error(`Client plugin default export must implement 'mount(root, options?)'`);
    }
    if (plugin.unmount !== undefined && typeof plugin.unmount !== 'function') {
        throw new Error(`Client plugin 'unmount' must be a function if provided`);
    }
    if (plugin.name !== undefined && typeof plugin.name !== 'string') {
        throw new Error(`Client plugin 'name' must be a string if provided`);
    }
    if (plugin.version !== undefined && typeof plugin.version !== 'string') {
        throw new Error(`Client plugin 'version' must be a string if provided`);
    }
}

/**
 * Test an ADB plugin module for required functions (without invoking them).
 * Accepts either a default export or direct module export implementing ADBPluginInterface.
 */
export const testAdbPlugin = async (adbPluginPath: string): Promise<void> => {
    const plugin = await loadPluginModule(adbPluginPath);
    if (!plugin || typeof plugin.install !== 'function' || typeof plugin.uninstall !== 'function') {
        throw new Error(`ADB plugin at "${adbPluginPath}" must export 'install' and 'uninstall' functions`);
    }
}

/**
 * Bluetooth plugin testing is skipped because there is no implementation yet.
 */
export const testBluetoothPlugin = async (_bluetoothPluginPath: string): Promise<void> => {
    // Intentionally a no-op while bluetooth plugins are not implemented.
    return;
}