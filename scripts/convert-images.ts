import fs from "fs";
import path from "path";
import sharp from "sharp";

const JPEG_QUALITY = 80;

const showHelp = () => {
  console.log(`Usage: npx tsx scripts/convert-images.ts [TARGET_DIRECTORY]

Recursively finds JPG/JPEG images in TARGET_DIRECTORY (or src/assets/photo if not specified),
resizes them to 50% of original dimensions, and re-compresses them as JPEG.
Output files are saved in the same directory with a '_resized' suffix.

Options:
  -h, --help    Show this help message and exit.
`);
};

const processImage = async (filePath: string) => {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const stem = path.basename(filePath, ext);

  if (stem.endsWith("_resized")) {
    console.log(`Skipping: ${filePath} (already a resized file)`);
    return;
  }

  const outputPath = path.join(dir, `${stem}_resized${ext}`);

  if (fs.existsSync(outputPath)) {
    console.log(`Skipping: ${outputPath} already exists`);
    return;
  }

  const image = sharp(filePath);
  const { width, height } = await image.metadata();

  if (!width || !height) {
    console.error(`Could not read dimensions of ${filePath}`);
    return;
  }

  await image
    .resize(Math.round(width / 2), Math.round(height / 2))
    .jpeg({ quality: JPEG_QUALITY })
    .toFile(outputPath);

  console.log(`Converted: ${filePath} → ${outputPath}`);
};

const run = async () => {
  const arg = process.argv[2];

  if (arg === "-h" || arg === "--help") {
    showHelp();
    process.exit(0);
  }

  const targetDir = arg ?? "src/assets/photo";

  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    console.error(`Error: Directory '${targetDir}' not found.`);
    showHelp();
    process.exit(1);
  }

  const findImages = (dir: string): string[] => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return findImages(full);
      if (/\.(jpg|jpeg)$/i.test(entry.name)) return [full];
      return [];
    });
  };

  const images = findImages(targetDir);
  console.log(`Found ${images.length} image(s) in ${targetDir}`);

  for (const img of images) {
    await processImage(img);
  }

  console.log("Done.");
};

run().catch(console.error);
