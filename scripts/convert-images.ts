import fs from "fs";
import path from "path";
import sharp from "sharp";

const JPEG_QUALITY = 80;
const WEBP_QUALITY = 80;

const SIZES = [
  { suffix: "sm", width: 640 },
  { suffix: "md", width: 1024 },
  { suffix: "lg", width: 1920 },
] as const;

const showHelp = () => {
  console.log(`Usage: npx tsx scripts/convert-images.ts [TARGET_DIRECTORY]

Recursively finds JPG/JPEG images in TARGET_DIRECTORY (or src/assets/photo if not specified),
and generates responsive variants in three sizes (sm: 640w, md: 1024w, lg: 1920w)
in both JPEG and WebP formats.

Output files are saved in the same directory with size suffixes (e.g. _sm.jpg, _md.webp).

Options:
  -h, --help    Show this help message and exit.
`);
};

const processImage = async (filePath: string) => {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const stem = path.basename(filePath, ext);

  // Skip already-processed files
  if (/_(?:sm|md|lg)$/.test(stem)) {
    return;
  }

  const image = sharp(filePath);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    console.error(`Could not read dimensions of ${filePath}`);
    return;
  }

  const originalWidth = metadata.width;

  for (const { suffix, width } of SIZES) {
    // Don't upscale: if original is smaller than target, use original width
    const targetWidth = Math.min(width, originalWidth);

    const jpegPath = path.join(dir, `${stem}_${suffix}.jpg`);
    const webpPath = path.join(dir, `${stem}_${suffix}.webp`);

    // Generate JPEG variant
    if (!fs.existsSync(jpegPath)) {
      await sharp(filePath)
        .resize(targetWidth)
        .jpeg({ quality: JPEG_QUALITY })
        .toFile(jpegPath);
      console.log(`Created: ${jpegPath}`);
    }

    // Generate WebP variant
    if (!fs.existsSync(webpPath)) {
      await sharp(filePath)
        .resize(targetWidth)
        .webp({ quality: WEBP_QUALITY })
        .toFile(webpPath);
      console.log(`Created: ${webpPath}`);
    }
  }
};

const findOriginalImages = (dir: string): string[] => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return findOriginalImages(full);
    if (!/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) return [];
    // Skip generated variants
    const stem = path.parse(entry.name).name;
    if (/_(?:sm|md|lg)$/.test(stem)) return [];
    return [full];
  });
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

  const images = findOriginalImages(targetDir);
  console.log(`Found ${images.length} original image(s) in ${targetDir}`);

  for (const img of images) {
    await processImage(img);
  }

  console.log("Done.");
};

run().catch(console.error);
