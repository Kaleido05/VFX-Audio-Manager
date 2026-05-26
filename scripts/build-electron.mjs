import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const isDev = process.argv.includes('--dev');

const commonConfig = {
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  external: ['electron'],
  sourcemap: isDev,
  minify: !isDev,
  treeShaking: true,
  legalComments: 'none',
};

async function build() {
  try {
    const outDir = path.join(root, 'dist', 'electron');

    // Build main process
    await esbuild.build({
      ...commonConfig,
      entryPoints: [path.join(root, 'electron', 'main.ts')],
      outfile: path.join(outDir, 'main.js'),
    });
    console.log('✓ Main process built');

    // Build preload script
    await esbuild.build({
      ...commonConfig,
      entryPoints: [path.join(root, 'electron', 'preload.ts')],
      outfile: path.join(outDir, 'preload.js'),
    });
    console.log('✓ Preload script built');

    // Write package.json for dist/electron to force CJS mode
    // (root package.json has "type": "module", but Electron main/preload are CJS)
    const pkgJson = JSON.stringify({ type: 'commonjs' }, null, 2);
    fs.writeFileSync(path.join(outDir, 'package.json'), pkgJson, 'utf-8');
    console.log('✓ dist/electron/package.json written (CJS)');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

build();
