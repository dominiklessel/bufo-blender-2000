import * as fs from "fs";
import * as path from "path";
import { createCanvas, loadImage } from "canvas";
import { RGB, HSL, RGBToHSL } from "./blend";

interface EmojiMetadata {
  filename: string;
  dominantColor: RGB;
  dominantHSL: HSL;
  width: number;
  height: number;
}

async function getDominantColor(imagePath: string): Promise<{
  color: RGB;
  width: number;
  height: number;
}> {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let totalR = 0,
    totalG = 0,
    totalB = 0,
    pixelCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;

    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
    pixelCount++;
  }

  if (pixelCount === 0)
    return {
      color: { r: 255, g: 255, b: 255 },
      width: image.width,
      height: image.height,
    };

  return {
    color: {
      r: Math.round(totalR / pixelCount),
      g: Math.round(totalG / pixelCount),
      b: Math.round(totalB / pixelCount),
    },
    width: image.width,
    height: image.height,
  };
}

async function preprocessEmojis(emojiDirPath: string, outputPath: string) {
  console.log("Starting emoji preprocessing...");

  const emojiFiles = fs
    .readdirSync(emojiDirPath)
    .filter((file) =>
      [".png", ".jpg", ".jpeg", ".gif"].includes(
        path.extname(file).toLowerCase()
      )
    );

  const metadata: EmojiMetadata[] = [];

  for (const file of emojiFiles) {
    const filePath = path.join(emojiDirPath, file);
    try {
      console.log(`Processing ${file}...`);
      const { color, width, height } = await getDominantColor(filePath);
      const dominantHSL = RGBToHSL(color);

      metadata.push({
        filename: file,
        dominantColor: color,
        dominantHSL,
        width,
        height,
      });
    } catch (error) {
      console.error(`Error processing emoji ${file}:`, error);
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
  console.log(`Preprocessing complete! Metadata saved to ${outputPath}`);
  console.log(`Processed ${metadata.length} emojis`);
}

// Run the preprocessing
const emojiDirPath = process.argv[2];
const outputPath = process.argv[3] || "emoji-metadata.json";

if (!emojiDirPath) {
  console.error(
    "Usage: ts-node preprocess-emojis.ts <bufo-emoji-directory> [output-file]"
  );
  process.exit(1);
}

preprocessEmojis(emojiDirPath, outputPath).catch(console.error);
