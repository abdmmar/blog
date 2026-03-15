import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const MANIFEST_PATH = "scripts/cloudflare-images-manifest.json";
const CONTENT_DIR = "src/content/photo";

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

  const mdxFiles = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"));

  let changed = false;

  for (const mdxFile of mdxFiles) {
    const mdxPath = path.join(CONTENT_DIR, mdxFile);
    const content = fs.readFileSync(mdxPath, "utf-8");

    const filepathMatch = content.match(/^filepath: "(.+)"$/m);
    if (!filepathMatch) {
      console.log(`Skipping ${mdxFile}: no filepath field found`);
      continue;
    }

    const filepath = filepathMatch[1];

    if (!filepath.startsWith("../../")) {
      console.log(`Skipping ${mdxFile}: already uploaded (${filepath})`);
      continue;
    }

    const stem = path.parse(filepath).name;
    let entry = manifest[stem];

    if (!entry) {
      const localPath = path.resolve(CONTENT_DIR, filepath);

      if (!fs.existsSync(localPath)) {
        console.error(`File not found: ${localPath} (referenced in ${mdxFile})`);
        continue;
      }

      const filename = path.basename(localPath);
      const ext = path.extname(filename).slice(1).toLowerCase();
      const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

      console.log(`Uploading ${filename}...`);
      await client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: filename,
          Body: fs.readFileSync(localPath),
          ContentType: contentType,
        }),
      );

      entry = { key: filename, url: `${publicUrl}/${filename}` };
      manifest[stem] = entry;
      changed = true;
      console.log(`Uploaded ${filename} → ${entry.url}`);
    } else {
      console.log(`Found in manifest: ${stem}`);
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
