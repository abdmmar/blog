import fs from "fs";
import path from "path";
import sharp from "sharp";
import exifReader from "exif-reader";

const IMAGE_DIR = "src/assets/photo";
const OUTPUT_DIR = "src/content/photo";

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const getExifData = async (
  filePath: string,
): Promise<{
  date: string;
  iso: string;
  shutterspeed: string;
  aperture: string;
  lens: string;
}> => {
  try {
    const metadata = await sharp(filePath).metadata();
    if (metadata.exif) {
      const exifData = exifReader(metadata.exif);
      if (exifData && exifData.Photo) {
        const date = exifData.Photo.DateTimeOriginal
          ? new Date(exifData.Photo.DateTimeOriginal)
              .toISOString()
              .split("T")[0]
          : new Date().toISOString().split("T")[0];
        const iso = exifData.Photo.ISOSpeedRatings
          ? exifData.Photo.ISOSpeedRatings.toString()
          : "Unknown";
        const shutterspeed = exifData.Photo.ExposureTime
          ? `1/${Math.round(1 / exifData.Photo.ExposureTime)}s`
          : "Unknown";
        const aperture = exifData.Photo.FNumber
          ? `f/${exifData.Photo.FNumber}`
          : "Unknown";
        const lens = exifData.Photo.LensModel
          ? exifData.Photo.LensModel.replace(/\x00/g, "").trim()
          : "Unknown";
        return { date, iso, shutterspeed, aperture, lens };
      }
    }
  } catch (error) {
    console.error(`Failed to extract EXIF data from ${filePath}:`, error);
  }
  return {
    date: new Date().toISOString().split("T")[0],
    iso: "Unknown",
    shutterspeed: "Unknown",
    aperture: "Unknown",
    lens: "Unknown",
  };
};

const generateMdxContent = ({
  id,
  date,
  iso,
  shutterspeed,
  lens,
  aperture,
  path,
}: {
  id: string;
  date: string;
  iso: string;
  shutterspeed: string;
  aperture: string;
  lens: string;
  path: string;
}) => `---
id: "${id}"
filepath: "${path}"
title: "Unknown"
alt: ""
date: "${date}"
author: "Abdullah Ammar"
iso: "${iso}"
shutterspeed: "${shutterspeed}"
aperture: "${aperture}"
lens: "${lens}"
---`;

const processImages = async () => {
  const directories = fs.readdirSync(IMAGE_DIR);

  for (const dir of directories) {
    const dirPath = path.join(IMAGE_DIR, dir);
    if (!fs.statSync(dirPath).isDirectory()) continue;

    const images = fs
      .readdirSync(dirPath)
      .filter((file) => /\.(webp|png|jpg|jpeg)$/i.test(file));

    for (const image of images) {
      const imagePath = path.join(dirPath, image);
      const filename = path.parse(image).name;
      const outputFilePath = path.join(OUTPUT_DIR, `${filename}.mdx`);

      if (fs.existsSync(outputFilePath)) {
        console.log(`Skipping: ${outputFilePath} already exists.`);
        continue;
      }

      const { date, iso, shutterspeed, aperture, lens } =
        await getExifData(imagePath);
      const mdxContent = generateMdxContent({
        id: filename,
        date,
        iso,
        shutterspeed,
        aperture,
        lens,
        path: imagePath.replace("src/", "../../"),
      });
      fs.writeFileSync(outputFilePath, mdxContent);
      console.log(`Generated: ${outputFilePath}`);
    }
  }
};

processImages().catch(console.error);
