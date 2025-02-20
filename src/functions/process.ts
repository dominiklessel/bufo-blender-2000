import {
  loadEmojiData,
  mapPixelsToEmojis,
  createPngOutput,
  processInputImage,
} from "./blend";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import path from "path";
import { Resource } from "sst";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

const s3 = new S3Client();

const emojiDirPath = path.join(__dirname, "./all-the-bufo");
const metadataPath = path.join(__dirname, "./emoji-metadata.json");
const emojiData = await loadEmojiData(emojiDirPath, metadataPath);

export const app = new Hono();

app.post("/", async (c) => {
  const body = await c.req.parseBody();

  if (!body.image || !(body.image instanceof File)) {
    return c.json({ error: "No valid image provided" }, 400);
  }

  if (!body.width || typeof body.width !== "string") {
    return c.json({ error: "No valid width provided" }, 400);
  }

  const arrayBuffer = await body.image.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const width = parseInt(body.width);

  const {
    pixels,
    width: outputWidth,
    height,
    alphaData,
  } = await processInputImage(buffer, width);
  const emojiGrid = mapPixelsToEmojis(pixels, emojiData, alphaData);
  const outputCanvas = await createPngOutput(
    emojiGrid,
    outputWidth,
    height,
    emojiData,
    alphaData,
  );

  const expiresIn = 60 * 10; // 10 minutes
  const bucket = Resource.BufoBlender2000Bucket;
  const key = `output/${body.image.name}`;
  const command = new PutObjectCommand({
    Bucket: bucket.name,
    Key: key,
    Body: outputCanvas.toBuffer(),
    ContentType: "image/png",
    Expires: new Date(Date.now() + expiresIn * 1000),
  });

  await s3.send(command);

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket.name,
      Key: key,
    }),
    {
      expiresIn,
    },
  );

  return c.text(url);
});

export const handler = handle(app);
