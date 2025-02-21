import { describe, expect, it } from "vitest";
import {
  loadEmojiData,
  mapPixelsToEmojis,
  createPngOutput,
  processInputImage,
} from "./blend";
import path from "path";
import { readFileSync, writeFileSync } from "fs";

const emojiDirPath = path.join(__dirname, "./all-the-bufo");
const metadataPath = path.join(__dirname, "./emoji-metadata.json");
const emojiData = await loadEmojiData({ emojiDirPath, metadataPath });

describe("blend", () => {
  it("should blend a drawn image", async () => {
    const imageBuffer = readFileSync(
      path.resolve(__dirname, "./fixtures/test-input-drawn.png"),
    );
    const inputBuffer = Buffer.from(imageBuffer);
    const targetWidth = 128;

    console.time("processInputImage");
    const {
      pixels,
      width: outputWidth,
      height,
      alphaData,
    } = await processInputImage({ inputBuffer, targetWidth });
    console.timeEnd("processInputImage");

    console.time("mapPixelsToEmojis");
    const emojiGrid = mapPixelsToEmojis({ pixels, emojiData, alphaData });
    console.timeEnd("mapPixelsToEmojis");

    console.time("createPngOutput");
    const outputBuffer = await createPngOutput({
      emojiGrid,
      width: outputWidth,
      height,
      emojiData,
      alphaData,
    });
    console.timeEnd("createPngOutput");
    writeFileSync(
      path.resolve(__dirname, "./fixtures/test-output-drawn.png"),
      outputBuffer.toBuffer(),
    );
  });
  it("should blend a photo", async () => {
    const imageBuffer = readFileSync(
      path.resolve(__dirname, "./fixtures/test-input-photo.jpeg"),
    );
    const inputBuffer = Buffer.from(imageBuffer);
    const targetWidth = 128;

    console.time("processInputImage");
    const {
      pixels,
      width: outputWidth,
      height,
      alphaData,
    } = await processInputImage({ inputBuffer, targetWidth });
    console.timeEnd("processInputImage");

    console.time("mapPixelsToEmojis");
    const emojiGrid = mapPixelsToEmojis({ pixels, emojiData, alphaData });
    console.timeEnd("mapPixelsToEmojis");

    console.time("createPngOutput");
    const outputBuffer = await createPngOutput({
      emojiGrid,
      width: outputWidth,
      height,
      emojiData,
      alphaData,
    });
    console.timeEnd("createPngOutput");
    writeFileSync(
      path.resolve(__dirname, "./fixtures/test-output-photo.png"),
      outputBuffer.toBuffer(),
    );
  });
  it("should blend a svg icon", async () => {
    const imageBuffer = readFileSync(
      path.resolve(__dirname, "./fixtures/test-input-icon.svg"),
    );
    const inputBuffer = Buffer.from(imageBuffer);
    const targetWidth = 128;

    console.time("processInputImage");
    const {
      pixels,
      width: outputWidth,
      height,
      alphaData,
    } = await processInputImage({ inputBuffer, targetWidth });
    console.timeEnd("processInputImage");

    console.time("mapPixelsToEmojis");
    const emojiGrid = mapPixelsToEmojis({ pixels, emojiData, alphaData });
    console.timeEnd("mapPixelsToEmojis");

    console.time("createPngOutput");
    const outputBuffer = await createPngOutput({
      emojiGrid,
      width: outputWidth,
      height,
      emojiData,
      alphaData,
    });
    console.timeEnd("createPngOutput");
    writeFileSync(
      path.resolve(__dirname, "./fixtures/test-output-icon.png"),
      outputBuffer.toBuffer(),
    );
  });
});
