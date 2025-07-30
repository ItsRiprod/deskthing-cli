import { execSync } from 'child_process'

const externals = [
  'ws',
  'vite',
  '@vitejs/plugin-react', 
  '@vitejs/plugin-legacy',
  '@tailwindcss/vite',
  'tailwindcss',
  'lightningcss',
  '@babel/core',
  '@babel/preset-typescript',
  'esbuild',
  'rollup'
];

const externalFlags = externals.map(ext => `--external:${ext}`).join(' ');

const command = `esbuild src/emulator/index.ts --bundle --platform=node --outdir=dist/emulator --format=esm ${externalFlags}`;

try {
  execSync(command, { stdio: 'inherit' });
  console.log('✅ Emulator build completed successfully');
} catch (error) {
  console.error('❌ Emulator build failed:', error.message);
  process.exit(1);
}