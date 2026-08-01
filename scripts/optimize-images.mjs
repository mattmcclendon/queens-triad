import { access, mkdir, readdir } from 'node:fs/promises';
import { extname, join, parse } from 'node:path';
import sharp from 'sharp';

const sourceDir = new URL('../public/images/originals/', import.meta.url);
const outputDir = new URL('../public/images/', import.meta.url);
const widths = [960, 1440, 1920];
const supported = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff']);

await mkdir(sourceDir, { recursive: true });
await mkdir(outputDir, { recursive: true });

const requested = new Set(process.argv.slice(2));
const files = (await readdir(sourceDir)).filter((file) => {
  if (!supported.has(extname(file).toLowerCase())) return false;
  return !requested.size || requested.has(file) || requested.has(parse(file).name);
});

if (!files.length) {
  console.log('Add the qt-* source images to public/images/originals, then run this again.');
  process.exit(0);
}

for (const file of files) {
  const input = join(sourceDir.pathname, file);
  const name = parse(file).name;

  for (const width of widths) {
    const base = sharp(input).rotate().resize({ width, withoutEnlargement: true });
    await base.clone().avif({ quality: 68, effort: 6 }).toFile(join(outputDir.pathname, `${name}-${width}.avif`));
    await base.clone().webp({ quality: 82, effort: 5 }).toFile(join(outputDir.pathname, `${name}-${width}.webp`));
  }

  console.log(`Optimized ${file}`);
}
