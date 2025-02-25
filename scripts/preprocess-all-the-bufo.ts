import * as fs from "fs";
import * as path from "path";
import { createCanvas, loadImage } from "canvas";
import { RGB, HSL, RGBToHSL } from "@/lib/colors";
import { type EmojiMetadata } from "@/lib/common";

const BUFO_EMOJI_DIR = path.join(__dirname, "../public/all-the-bufo");
const EMOJI_METADATA_PATH = path.join(
  __dirname,
  "../src/app/data/emoji-metadata.json",
);

type ColorCount = {
  color: RGB;
  count: number;
};

async function getDominantColor(
  imagePath: string,
): Promise<Omit<EmojiMetadata, "filename">> {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Use a color quantization approach
  // We'll use a simple binning method with reduced precision (4 bits per channel)
  // This gives us 16 values per channel, so 4096 possible colors
  const colorMap = new Map<string, ColorCount>();

  for (let i = 0; i < data.length; i += 4) {
    // Skip transparent pixels
    if (data[i + 3] < 128) continue;

    // Apply perceptual weights (sRGB to linear RGB conversion approximated)
    // These weights better represent human perception of color
    const r = Math.round(data[i] / 16);
    const g = Math.round(data[i + 1] / 16);
    const b = Math.round(data[i + 2] / 16);

    // Create a key for this quantized color
    const key = `${r}-${g}-${b}`;

    if (colorMap.has(key)) {
      const entry = colorMap.get(key)!;
      entry.count++;
    } else {
      colorMap.set(key, {
        color: {
          r: data[i],
          g: data[i + 1],
          b: data[i + 2],
        },
        count: 1,
      });
    }
  }

  // Handle empty image case
  if (colorMap.size === 0) {
    const defaultRGB = { r: 255, g: 255, b: 255 };
    return {
      dominantRGB: defaultRGB,
      dominantHSL: RGBToHSL(defaultRGB),
      width: image.width,
      height: image.height,
    };
  }

  // Find the most frequent color
  let maxCount = 0;
  let dominantColor: RGB = { r: 0, g: 0, b: 0 };

  colorMap.forEach((entry) => {
    if (entry.count > maxCount) {
      maxCount = entry.count;
      dominantColor = entry.color;
    }
  });

  return {
    dominantRGB: dominantColor,
    dominantHSL: RGBToHSL(dominantColor),
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
        path.extname(file).toLowerCase(),
      ),
    );

  const metadata: EmojiMetadata[] = [];

  for (const file of emojiFiles) {
    const filePath = path.join(emojiDirPath, file);
    try {
      console.log(`Processing ${file}...`);
      const { dominantHSL, dominantRGB, width, height } =
        await getDominantColor(filePath);

      metadata.push({
        filename: file,
        dominantRGB,
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

async function main() {
  await preprocessEmojis(BUFO_EMOJI_DIR, EMOJI_METADATA_PATH);
}

main();
