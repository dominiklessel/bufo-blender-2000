import { HSL, RGB } from "@/lib/colors";
import { Prettify } from "@/lib/utils";

export type EmojiMetadata = {
  filename: string;
  dominantRGB: RGB;
  dominantHSL: HSL;
  width: number;
  height: number;
};

export type WebEmojiMetadata = Prettify<EmojiMetadata & { sourceUrl: string }>;
