import * as fs from "fs";
import * as path from "path";
import { createCanvas, loadImage, Image } from "canvas";

interface EmojiData {
  path: string;
  dominantColor: RGB;
  dominantHSL: HSL;
  width: number;
  height: number;
}

// Add Canvas type to avoid TypeScript errors
type Canvas = ReturnType<typeof createCanvas>;

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export async function loadEmojiData(
  emojiDirPath: string,
  metadataPath: string
): Promise<EmojiData[]> {
  // Try to load preprocessed metadata
  if (fs.existsSync(metadataPath)) {
    console.log("Using preprocessed emoji metadata...");
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    return metadata.map((item: any) => ({
      ...item,
      path: path.join(emojiDirPath, item.filename),
    }));
  }

  // Fallback to processing emojis in real-time
  console.log(
    "No preprocessed metadata found, analyzing emojis in real-time..."
  );
  const emojiFiles = fs
    .readdirSync(emojiDirPath)
    .filter((file) =>
      [".png", ".jpg", ".jpeg", ".gif"].includes(
        path.extname(file).toLowerCase()
      )
    );

  const emojiData: EmojiData[] = [];

  for (const file of emojiFiles) {
    const filePath = path.join(emojiDirPath, file);
    try {
      const image = await loadImage(filePath);
      const {
        color: dominantColor,
        width,
        height,
      } = await getDominantColor(filePath);
      const dominantHSL = RGBToHSL(dominantColor);
      emojiData.push({
        path: filePath,
        dominantColor,
        dominantHSL,
        width,
        height,
      });
    } catch (error) {
      console.error(`Error processing emoji ${file}:`, error);
    }
  }

  return emojiData;
}

export async function getDominantColor(imagePath: string): Promise<{
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

export async function processInputImage(
  inputPath: string | Buffer,
  targetWidth: number
): Promise<{
  pixels: RGB[];
  width: number;
  height: number;
  alphaData: number[];
}> {
  const image = await loadImage(inputPath);

  // Calculate dimensions preserving aspect ratio
  const aspectRatio = image.height / image.width;
  const width = targetWidth;
  const height = Math.round(targetWidth * aspectRatio);

  // Resize image
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, width, height);

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Convert to RGB array and store alpha values
  const pixels: RGB[] = [];
  const alphaData: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    pixels.push({
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
    });
    alphaData.push(data[i + 3]);
  }

  return { pixels, width, height, alphaData };
}

export function mapPixelsToEmojis(
  pixels: RGB[],
  emojiData: EmojiData[],
  alphaData: number[]
): string[] {
  return pixels.map((pixel, index) => {
    // If pixel is fully or mostly transparent, return empty string
    if (alphaData[index] < 50) {
      return "";
    }

    const pixelHSL = RGBToHSL(pixel);

    // Find best matching emoji
    let bestMatch = emojiData[0];
    let minDistance = Number.MAX_VALUE;

    for (const emoji of emojiData) {
      // Using a weighted color distance that prioritizes hue and saturation
      const distance = getColorDistance(pixelHSL, emoji.dominantHSL);
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = emoji;
      }
    }

    return path.basename(bestMatch.path);
  });
}

export async function createPngOutput(
  emojiGrid: string[],
  width: number,
  height: number,
  emojiData: EmojiData[],
  alphaData: number[]
): Promise<Canvas> {
  // Create a mapping of filenames to emoji data for quick lookup
  const emojiMap = new Map<string, EmojiData>();
  emojiData.forEach((emoji) => {
    const filename = path.basename(emoji.path);
    emojiMap.set(filename, emoji);
  });

  // Calculate emoji size - assuming square emojis for simplicity
  // Use the first emoji to determine size
  const firstEmoji = await loadImage(emojiData[0].path);
  const emojiSize = firstEmoji.width; // Assuming square emojis

  // Create canvas for the final image with transparency support
  const outputCanvas = createCanvas(width * emojiSize, height * emojiSize);
  const ctx = outputCanvas.getContext("2d");
  // Make canvas transparent by default
  ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

  // Draw each emoji on the canvas
  const emojiPromises: Promise<void>[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const emojiFilename = emojiGrid[index];

      // Skip empty/transparent pixels
      if (!emojiFilename || alphaData[index] < 50) {
        continue;
      }

      const emoji = emojiMap.get(emojiFilename);

      if (emoji) {
        const promise = loadImage(emoji.path).then((img) => {
          ctx.drawImage(
            img,
            x * emojiSize,
            y * emojiSize,
            emojiSize,
            emojiSize
          );
        });
        emojiPromises.push(promise);
      }
    }
  }

  // Wait for all emojis to be drawn
  await Promise.all(emojiPromises);

  return outputCanvas;
}

export function saveOutputPng(canvas: Canvas, outputPath: string) {
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);
}

// Color utility functions (you'll need to implement these)
// Create a colorUtils.ts file with these functions
export function RGBToHSL(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    switch (max) {
      case r:
        h = (g - b) / diff + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
    }

    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function getColorDistance(hsl1: HSL, hsl2: HSL): number {
  // Weighted distance calculation prioritizing hue and saturation
  const hWeight = 1.0;
  const sWeight = 0.8;
  const lWeight = 0.6;

  // Hue is circular, so we need special calculation
  const hDiff =
    Math.min(Math.abs(hsl1.h - hsl2.h), 360 - Math.abs(hsl1.h - hsl2.h)) / 180;
  const sDiff = Math.abs(hsl1.s - hsl2.s) / 100;
  const lDiff = Math.abs(hsl1.l - hsl2.l) / 100;

  return hWeight * hDiff + sWeight * sDiff + lWeight * lDiff;
}
