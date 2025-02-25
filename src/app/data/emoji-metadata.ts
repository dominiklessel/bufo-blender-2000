import data from "./emoji-metadata.json";
import { type WebEmojiMetadata } from "@/lib/common";

export const emojiMetadata = data.map((emoji) => ({
  ...emoji,
  sourceUrl: `/all-the-bufo/${emoji.filename}`,
})) as WebEmojiMetadata[];
