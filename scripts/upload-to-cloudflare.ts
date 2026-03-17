import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const MANIFEST_PATH = "scripts/cloudflare-images-manifest.json";
const CONTENT_DIR = "src/content/photo";
const IMAGE_DIR = "src/assets/photo";

interface ManifestEntry {
  key: string;
  url: string;
}

type Manifest = Record<string, ManifestEntry>;

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * Find all responsive image variants (_sm, _md, _lg in .jpg and .webp)
 * in the image directory that haven't been uploaded yet.
 */
const findVariants = (dir: string): string[] => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return findVariants(full);
    if (!/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) return [];
    // Only include responsive variants
    const stem = path.parse(entry.name).name;
    if (/_(?:sm|md|lg)$/.test(stem)) return [full];
    return [];
  });
};

const run = async () => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/$/, "");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    console.error(
      "Missing required env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET_NAME, CLOUDFLARE_R2_PUBLIC_URL",
    );
    process.exit(1);
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const manifest: Manifest = JSON.parse(
    fs.readFileSync(MANIFEST_PATH, "utf-8"),
  );

  let changed = false;

  // 1. Upload all responsive variants from the image directory
  const variants = findVariants(IMAGE_DIR);
  console.log(`Found ${variants.length} responsive variant(s) to check`);

  for (const variantPath of variants) {
    const filename = path.basename(variantPath);
    const stem = path.parse(filename).name;

    if (manifest[stem]) {
      continue; // Already uploaded
    }

    const ext = path.extname(filename).slice(1).toLowerCase();
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

    console.log(`Uploading ${filename}...`);
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: filename,
        Body: fs.readFileSync(variantPath),
        ContentType: contentType,
      }),
    );

    const entry = { key: filename, url: `${publicUrl}/${filename}` };
    manifest[stem] = entry;
    changed = true;
    console.log(`Uploaded ${filename} → ${entry.url}`);
  }

  // 2. Update MDX content files to point to R2 URLs (using _lg.jpg as main filepath)
  const mdxFiles = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"));

  for (const mdxFile of mdxFiles) {
    const mdxPath = path.join(CONTENT_DIR, mdxFile);
    const content = fs.readFileSync(mdxPath, "utf-8");

    const filepathMatch = content.match(/^filepath: "(.+)"$/m);
    if (!filepathMatch) {
      console.log(`Skipping ${mdxFile}: no filepath field found`);
      continue;
    }

    const filepath = filepathMatch[1];

    // Skip if already pointing to a cloud URL
    if (!filepath.startsWith("../../")) {
      console.log(`Skipping ${mdxFile}: already uploaded (${filepath})`);
      continue;
    }

    // Derive the _lg stem from the local path
    const originalStem = path.parse(filepath).name;
    // Remove _resized suffix if present to get the base stem
    const baseStem = originalStem.replace(/_resized$/, "");
    const lgStem = `${baseStem}_lg`;
    const entry = manifest[lgStem];

    if (!entry) {
      console.error(`No manifest entry for ${lgStem} (referenced in ${mdxFile})`);
      continue;
    }

    const updated = content.replace(
      /^filepath: ".*"$/m,
      `filepath: "${entry.url}"`,
    );
    fs.writeFileSync(mdxPath, updated);
    console.log(`Updated ${mdxFile} → ${entry.url}`);
  }

  if (changed) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log("Manifest saved.");
  }

  console.log("Done.");
};

run().catch(console.error);
