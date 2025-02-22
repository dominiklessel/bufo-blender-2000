import data from "./emoji-metadata.json";

export type EmojiMetadata = {
  filename: string;
  sourceUrl: string;
  dominantColor: {
    r: number;
    g: number;
    b: number;
  };
  dominantHSL: {
    h: number;
    s: number;
    l: number;
  };
  width: number;
  height: number;
};

export const emojiMetadata = data.map((emoji) => ({
  ...emoji,
  sourceUrl: `/all-the-bufo/${emoji.filename}`,
})) as EmojiMetadata[];
