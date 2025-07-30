import { execSync } from 'child_process'
import { Logger } from './logger'

async function checkLatestVersion(): Promise<string | null> {
  try {
    const response = execSync('npm view @deskthing/cli version', { 
      encoding: 'utf8', 
      stdio: 'pipe' 
    });
    return response.trim();
  } catch (error) {
    // Fallback to npm registry API
    try {
      const https = await import('https');
      return new Promise((resolve) => {
        https.get('https://registry.npmjs.org/@deskthing/cli/latest', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const pkg = JSON.parse(data);
              resolve(pkg.version);
            } catch {
              resolve(null);
            }
          });
        }).on('error', () => resolve(null));
      });
    } catch {
      return null;
    }
  }
}

export async function checkForUpdates(currentVersion: string, autoUpdate: boolean) {
  try {
    const latestVersion = await checkLatestVersion();
    if (latestVersion && latestVersion !== currentVersion) {
      Logger.warning(`Update available: ${currentVersion} → ${latestVersion}`);
      if (autoUpdate) {
        Logger.startProgress(`Updating to ${latestVersion}...`);
        execSync('npm install @deskthing/cli@latest', { stdio: 'inherit' });
        Logger.stopProgress();
        Logger.success(`Updated to ${latestVersion}`);
      } else {
        Logger.info(`Run 'npm install @deskthing/cli@latest' to update`);
      }
    }
  } catch {
    Logger.stopProgress()
    // Silently fail - don't interrupt the user experience
  }
}