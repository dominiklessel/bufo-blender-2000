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
  it("should blend the image", async () => {
    const imageBuffer = readFileSync(
      path.resolve(__dirname, "./test-input.png"),
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
      path.resolve(__dirname, "./test-output.png"),
      outputBuffer.toBuffer(),
    );
  });
});
