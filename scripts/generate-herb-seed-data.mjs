// Generates src/lib/storage/seed-data.ts from the source images in
// assets/herb-seed-sources/. Re-run manually whenever those source images
// change:
//
//   node scripts/generate-herb-seed-data.mjs

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = new URL("../assets/herb-seed-sources/", import.meta.url);
const OUTPUT_FILE = new URL("../src/lib/storage/seed-data.ts", import.meta.url);

const RESIZE_WIDTH = 480;
const JPEG_QUALITY = 75;
const SOURCE_DIR_RELATIVE = "assets/herb-seed-sources";

function titleFromFilename(filename) {
  return filename.replace(/\.jpg$/i, "").replace(/-/g, " ");
}

async function main() {
  const filenames = (await readdir(SOURCE_DIR))
    .filter((name) => name.toLowerCase().endsWith(".jpg"))
    .sort();

  const entries = [];
  for (const filename of filenames) {
    const inputPath = path.join(new URL(SOURCE_DIR).pathname, filename);
    const original = await readFile(inputPath);
    const resized = await sharp(original)
      .resize({ width: RESIZE_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    entries.push({
      name: titleFromFilename(filename),
      path: `${SOURCE_DIR_RELATIVE}/${filename}`,
      imageDataUrl: `data:image/jpeg;base64,${resized.toString("base64")}`,
    });
  }

  const body = entries
    .map(
      (entry) =>
        `  {\n    name: ${JSON.stringify(entry.name)},\n    path: ${JSON.stringify(entry.path)},\n    imageDataUrl: ${JSON.stringify(entry.imageDataUrl)},\n  },`,
    )
    .join("\n");

  const output = `// GENERATED FILE — do not edit by hand.
// Regenerate with: node scripts/generate-herb-seed-data.mjs
// Source images: assets/herb-seed-sources/*.jpg

export interface HerbSeedCard {
  name: string;
  path: string; // source file location, for traceability/regeneration only — never persisted onto a HerbCard
  imageDataUrl: string;
}

export const HERB_SEED_CARDS: HerbSeedCard[] = [
${body}
];
`;

  await writeFile(new URL(OUTPUT_FILE).pathname, output, "utf8");
  console.log(`Wrote ${entries.length} seed cards to ${path.relative(process.cwd(), new URL(OUTPUT_FILE).pathname)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
