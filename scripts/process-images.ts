import { execSync } from "child_process";

/**
 * Unified image processing pipeline.
 *
 * Runs all three steps in sequence:
 * 1. convert-images  — Generate responsive variants (sm/md/lg in JPEG + WebP)
 * 2. generate-content — Create MDX content files with EXIF metadata
 * 3. upload-images    — Upload variants to Cloudflare R2 and update content URLs
 *
 * Usage:
 *   pnpm process-images [TARGET_DIRECTORY]
 *
 * The TARGET_DIRECTORY argument is forwarded to convert-images.
 * Steps 2 and 3 always operate on their default directories.
 */

const targetDir = process.argv[2];

const steps = [
  {
    name: "1/3 Generating responsive image variants",
    cmd: targetDir
      ? `pnpm convert-images ${targetDir}`
      : "pnpm convert-images",
  },
  {
    name: "2/3 Generating MDX content files",
    cmd: "pnpm generate-content",
  },
  {
    name: "3/3 Uploading to Cloudflare R2",
    cmd: "pnpm upload-images",
  },
];

for (const step of steps) {
  console.log(`\n=== ${step.name} ===\n`);
  try {
    execSync(step.cmd, { stdio: "inherit" });
  } catch {
    console.error(`\nFailed at: ${step.name}`);
    process.exit(1);
  }
}

console.log("\n=== All done! ===\n");
