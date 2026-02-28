import fs from 'fs';
import path from 'path';

const root = process.cwd();
const src = path.join(root, 'frontend', 'dist');
const dest = path.join(root, 'backend', 'public');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

if (!fs.existsSync(src)) {
  console.error(`Frontend dist not found at ${src}`);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
copyDir(src, dest);
console.log(`Synced frontend dist to ${dest}`);

fs.writeFileSync(path.join(dest, '.gitkeep'), '');
