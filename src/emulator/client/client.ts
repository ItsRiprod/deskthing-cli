import { createServer } from "http";
import { existsSync, readFileSync, statSync } from "fs";
import { extname, join, normalize } from "path";
import { fileURLToPath } from "url";
import { URL } from "url";
import { deskthingConfig } from "../../config/deskthing.config";
import { Logger } from "../services/logger";
import { CallbackService } from "./callbackService";

// Types for client device detection (simplified versions)
enum ClientConnectionMethod {
  LAN = "LAN",
  Unknown = "Unknown"
}

enum ClientPlatformIDs {
  Desktop = "Desktop",
  Tablet = "Tablet",
  Iphone = "Iphone",
  Unknown = "Unknown"
}

export class DevClient {
  private deskthingPath: string;

  constructor() {
    // Mock user data paths - these would normally come from configuration
    this.deskthingPath = join(process.cwd(), 'deskthing');

    // if deskthingPath does not exist, warn the user to update with `npx @deskthing/cli update --noOverwrite`
    if (!existsSync(this.deskthingPath)) {
      Logger.warn(`DeskThing path does not exist: ${this.deskthingPath}`);
      Logger.warn("Please run `npx @deskthing/cli update --noOverwrite` to set up the environment.");
    }
  }

  private setCorsHeaders(res: any): void {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  private handleCorsPreflightRequest(req: any, res: any): boolean {
    if (req.method === 'OPTIONS') {
      this.setCorsHeaders(res);
      res.writeHead(200);
      res.end();
      return true;
    }
    return false;
  }

  async start(): Promise<void> {
    const __dirname = fileURLToPath(new URL(".", import.meta.url));
    const staticPath = join(__dirname, "./template");

    Logger.debug(`Static files will be served from: ${staticPath}`);

    const mimeTypes = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".json": "application/json",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
      ".ttf": "font/ttf",
      ".eot": "application/vnd.ms-fontobject",
      ".otf": "font/otf",
    };



    const server = createServer((req, res) => {

      this.setCorsHeaders(res);

      // Handle preflight requests
      if (this.handleCorsPreflightRequest(req, res)) {
        return;
      }

      // Handle only GET requests for most routes (except proxy which may handle POST)
      if (!["GET", "POST"].includes(req.method || "")) {
        res.statusCode = 405;
        res.end("Method Not Allowed");
        return;
      }

      // Get URL path and parse query parameters
      const url = new URL(req.url || "/", `http://${req.headers.host}`);
      let urlPath = url.pathname;
      const queryParams = url.searchParams;

      Logger.debug(`${req.method} ${urlPath}`);

      // Route handling
      if (this.handleSpecialRoutes(req, res, urlPath, queryParams)) {
        return;
      }

      if (this.handleClientRoutes(req, res, urlPath, staticPath, mimeTypes)) {
        return;
      }

      if (this.handleResourceRoutes(req, res, urlPath)) {
        return;
      }

      if (this.handleProxyRoutes(req, res, urlPath, queryParams)) {
        return;
      }

      // Default route handling - serve from template directory
      if (urlPath === "/") {
        urlPath = "/index.html";
      }

      // Security: Prevent directory traversal attacks
      const safePath = normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
      const filePath = join(staticPath, safePath);
      Logger.debug(`Serving ${urlPath} from template`);

      this.serveStaticFile(res, filePath, mimeTypes, () => {
        // Try serving index.html as fallback for SPA routing
        const indexPath = join(staticPath, "index.html");
        this.serveStaticFile(res, indexPath, mimeTypes, () => {
          res.statusCode = 404;
          res.end("Not Found");
        });
      });
    });

    const clientPort = deskthingConfig.development.client.clientPort;
    server.listen(clientPort, () => {
      Logger.info(
        `\x1b[36m🚀 Development Server is running at http://localhost:${clientPort}\x1b[0m`
      );
      Logger.info(
        `\x1b[33m🔄 Callback Server is running at http://localhost:${clientPort}/callback \x1b[0m`
      );
    });
  }

  private handleSpecialRoutes(req: any, res: any, urlPath: string, queryParams: URLSearchParams): boolean {
    // Handle callback request
    if (urlPath.startsWith("/callback")) {
      CallbackService.handleCallback(req, res);
      return true;
    }

    // Handle config request
    if (urlPath === "/config") {
      try {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(deskthingConfig.development.client));
        return true;
      } catch (err) {
        Logger.error("Error serving config:", err);
        res.statusCode = 500;
        res.end("Internal Server Error");
        return true;
      }
    }

    return false;
  }

  private handleClientRoutes(req: any, res: any, urlPath: string, staticPath: string, mimeTypes: Record<string, string>): boolean {
    // Handle /manifest.json redirect
    if (urlPath === "/manifest.json") {
      res.writeHead(302, { "Location": "/client/manifest.json" });
      res.end();
      return true;
    }

    // Handle /client/manifest.json
    if (urlPath === "/client/manifest.json") {
      const clientIp = req.headers.host?.split(':')[0] || "localhost";
      const clientPort = deskthingConfig.development.client.clientPort;

      // Create a mock manifest response
      const mockManifest = {
        id: "mock-client",
        name: "Mock DeskThing Client",
        short_name: "MockClient",
        description: "Development mock client for DeskThing",
        version: "1.0.0",
        author: "DeskThing Dev",
        repository: "https://github.com/deskthing/deskthing",
        context: {
          ip: clientIp,
          port: clientPort,
          method: "LAN",
          id: "Desktop",
          name: "Desktop"
        },
        connectionId: this.generateConnectionId(),
        reactive: true,
        compatibility: {
          server: "1.0.0",
          app: "1.0.0"
        }
      };

      Logger.info("Client connected via manifest request");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(mockManifest));
      return true;
    }

    // Handle /client/* routes - serve from webapp directory or template as fallback
    if (urlPath.startsWith("/client")) {
      const subPath = urlPath.substring(7) || "/index.html"; // Remove /client
      const templateFilePath = join(staticPath, subPath);

      // Try template directory
      this.serveStaticFile(res, templateFilePath, mimeTypes, () => {
        // Fallback to index.html for SPA routing
        const templateIndexPath = join(staticPath, "index.html");

        this.serveStaticFile(res, templateIndexPath, mimeTypes, () => {
          res.statusCode = 404;
          res.end("App not found");
        });
      });

      return true;
    }

    return false;
  }

  private handleResourceRoutes(req: any, res: any, urlPath: string): boolean {
    // Handle /icons route
    if (urlPath.startsWith("/icons")) {
      const iconPath = urlPath.substring(6); // Remove /icons
      const fullIconPath = join(this.deskthingPath, 'icons', iconPath);

      this.serveStaticFile(res, fullIconPath, {}, () => {
        res.statusCode = 404;
        res.end("Icon not found");
      }, {
        maxAge: "1d",
        immutable: true,
        etag: true,
        lastModified: true
      });
      return true;
    }

    // Handle /resource/icons route
    if (urlPath.startsWith("/resource/icons")) {
      const iconPath = urlPath.substring(15); // Remove /resource/icons
      const fullIconPath = join(this.deskthingPath, 'icons', iconPath);

      this.serveStaticFile(res, fullIconPath, {}, () => {
        res.statusCode = 404;
        res.end("Icon not found");
      }, {
        maxAge: "1d",
        immutable: true,
        etag: true,
        lastModified: true
      });
      return true;
    }

    // Handle /resource/image/:appName/:imageName
    const imageMatch = urlPath.match(/^\/resource\/image\/([^\/]+)\/([^\/]+)$/);
    if (imageMatch) {
      const [, , imageName] = imageMatch;

      if (!imageName) {
        res.statusCode = 400;
        res.end("Image name is required");
        return true;
      }

      const imagePath = join(this.deskthingPath, "images", imageName);

      this.serveStaticFile(res, imagePath, {}, () => {
        res.statusCode = 404;
        res.end("Image not found");
      });
      return true;
    }

    return false;
  }

  private handleProxyRoutes(req: any, res: any, urlPath: string, queryParams: URLSearchParams): boolean {
    // Handle /proxy/fetch/:url(*)
    const proxyFetchMatch = urlPath.match(/^\/proxy\/fetch\/(.+)$/);
    if (proxyFetchMatch) {
      const targetUrl = decodeURIComponent(proxyFetchMatch[1]);

      this.proxyRequest(targetUrl, res);
      return true;
    }

    // Handle /proxy/v1
    if (urlPath === "/proxy/v1") {
      const url = queryParams.get("url");

      if (!url) {
        res.statusCode = 400;
        res.end("Missing url query parameter");
        return true;
      }

      Logger.debug(`Proxying resource from: ${url}`);
      this.proxyRequest(url, res);
      return true;
    }

    return false;
  }

  private serveStaticFile(
    res: any,
    filePath: string,
    mimeTypes: Record<string, string>,
    onNotFound: () => void,
    cacheOptions?: { maxAge?: string; immutable?: boolean; etag?: boolean; lastModified?: boolean }
  ): void {
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      try {
        // Determine content type based on file extension
        const ext = extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || this.getDefaultMimeType(ext);

        const fileContent = readFileSync(filePath);
        const headers: Record<string, string> = { "Content-Type": contentType };

        // Add cache headers if specified
        if (cacheOptions) {
          if (cacheOptions.maxAge) {
            headers["Cache-Control"] = `max-age=${this.parseCacheMaxAge(cacheOptions.maxAge)}${cacheOptions.immutable ? ', immutable' : ''}`;
          }
          if (cacheOptions.etag) {
            headers["ETag"] = `"${this.generateETag(fileContent)}"`;
          }
          if (cacheOptions.lastModified) {
            const stats = statSync(filePath);
            headers["Last-Modified"] = stats.mtime.toUTCString();
          }
        }

        res.writeHead(200, headers);
        res.end(fileContent);
      } catch (err) {
        Logger.error(`Error serving ${filePath}:`, err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    } else {
      onNotFound();
    }
  }

  private async proxyRequest(targetUrl: string, res: any): Promise<void> {
    try {
      Logger.debug(`Proxying request to: ${targetUrl}`);

      const response = await fetch(targetUrl);

      if (!response.ok) {
        res.statusCode = response.status;
        res.end(`Upstream resource responded with ${response.status}`);
        return;
      }

      // Copy headers from the original response
      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }

      // Copy other relevant headers
      ['content-length', 'content-encoding', 'cache-control'].forEach(header => {
        const value = response.headers.get(header);
        if (value) {
          res.setHeader(header, value);
        }
      });

      if (!response.body) {
        res.statusCode = 204;
        res.end();
        return;
      }

      // Stream the response directly to the client
      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }

      res.end();
    } catch (error) {
      Logger.error('Error proxying resource:', error);
      res.statusCode = 500;
      res.end(`Error fetching resource: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getDefaultMimeType(ext: string): string {
    const defaultMimeTypes: Record<string, string> = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".json": "application/json",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
      ".ttf": "font/ttf",
      ".eot": "application/vnd.ms-fontobject",
      ".otf": "font/otf",
    };

    return defaultMimeTypes[ext] || "application/octet-stream";
  }

  private parseCacheMaxAge(maxAge: string): number {
    if (maxAge.endsWith('d')) {
      return parseInt(maxAge.slice(0, -1)) * 24 * 60 * 60;
    }
    if (maxAge.endsWith('h')) {
      return parseInt(maxAge.slice(0, -1)) * 60 * 60;
    }
    if (maxAge.endsWith('m')) {
      return parseInt(maxAge.slice(0, -1)) * 60;
    }
    return parseInt(maxAge) || 0;
  }

  private generateETag(content: Buffer): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private generateConnectionId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private getDeviceType(userAgent: string | undefined, ip: string, port: number) {
    if (!userAgent) {
      return {
        method: ClientConnectionMethod.LAN,
        ip,
        port,
        id: ClientPlatformIDs.Unknown,
        name: 'unknown'
      };
    }

    userAgent = userAgent.toLowerCase();

    const deviceMap = {
      // Desktops
      linux: { id: ClientPlatformIDs.Desktop, name: 'linux' },
      win: { id: ClientPlatformIDs.Desktop, name: 'windows' },
      mac: { id: ClientPlatformIDs.Desktop, name: 'mac' },
      chromebook: { id: ClientPlatformIDs.Desktop, name: 'chromebook' },

      // Tablets
      ipad: { id: ClientPlatformIDs.Tablet, name: 'tablet' },
      webos: { id: ClientPlatformIDs.Tablet, name: 'webos' },
      kindle: { id: ClientPlatformIDs.Tablet, name: 'kindle' },

      // Mobile
      iphone: { id: ClientPlatformIDs.Iphone, name: 'iphone' },
      'firefox os': { id: ClientPlatformIDs.Iphone, name: 'firefox-os' },
      blackberry: { id: ClientPlatformIDs.Iphone, name: 'blackberry' },
      'windows phone': { id: ClientPlatformIDs.Iphone, name: 'windows-phone' }
    };

    // Special case for Android
    if (userAgent.includes('android')) {
      return {
        method: ClientConnectionMethod.LAN,
        ip,
        port,
        id: userAgent.includes('mobile') ? ClientPlatformIDs.Iphone : ClientPlatformIDs.Tablet,
        name: userAgent.includes('mobile') ? 'android' : 'tablet'
      };
    }

    // Find matching device from map
    const matchedDevice = Object.entries(deviceMap).find(([key]) => userAgent.includes(key));
    if (matchedDevice) {
      return { method: ClientConnectionMethod.LAN, ip, port, ...matchedDevice[1] };
    }

    // Default to unknown
    return {
      method: ClientConnectionMethod.LAN,
      ip,
      port,
      id: ClientPlatformIDs.Unknown,
      name: 'unknown'
    };
  }


}
