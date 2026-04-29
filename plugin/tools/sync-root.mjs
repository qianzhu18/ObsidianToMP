import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(pluginDir, '..');

if (!fs.existsSync(path.join(repoRoot, '.git'))) {
  throw new Error(`Refusing to sync release files outside the repository root: ${repoRoot}`);
}

const files = ['main.js', 'styles.css', 'manifest.json', 'versions.json'];

for (const file of files) {
  const source = path.join(pluginDir, file);
  const target = path.join(repoRoot, file);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing build artifact: ${source}`);
  }
  fs.copyFileSync(source, target);
  console.log(`Synced ${file} to repository root`);
}
