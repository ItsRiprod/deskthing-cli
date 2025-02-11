  import path from 'path';
  import fs from 'fs';

  type PlatformTypes = 'linux' | 'windows' | 'macos';
  type TagTypes = 'system' | 'utility' | 'media' | 'development' | 'network' | 'gaming';
  export type AppManifest = {
    id: string;
    isWebApp: boolean;
    requires: string[];
    label: string;
    version: string;
    description: string;
    author: string;
    platforms: PlatformTypes[];
    homepage: string;
    version_code: number;
    compatible_server: string;
    compatible_client: string;
    repository: string;
    tags: TagTypes[];
    requiredVersions: Record<string, string>;
  };

  export const getManifestDetails = (): AppManifest => {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    return {
      id: manifest.id,
      isWebApp: manifest.isWebApp,
      requires: manifest.requires,
      label: manifest.label,
      version: manifest.version,
      description: manifest.description,
      author: manifest.author,
      platforms: manifest.platforms as PlatformTypes[],
      homepage: manifest.homepage,
      version_code: manifest.version_code,
      compatible_server: manifest.compatible_server,
      compatible_client: manifest.compatible_client,
      repository: manifest.repository,
      tags: manifest.tags as TagTypes[],
      requiredVersions: manifest.requiredVersions
    };
  };