import { describe, expect, it } from "vitest";
import { app } from "./process-handler";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

describe("POST /", () => {
  it("should process the image", async () => {
    const imageBuffer = readFileSync(
      path.resolve(__dirname, "./test-input.png"),
    );
    const mockFile = new File([imageBuffer], "test-image.png", {
      type: "image/png",
    });

    const formData = new FormData();
    formData.append("image", mockFile);
    formData.append("width", "50");

    const res = await app.request("/", {
      method: "POST",
      body: formData,
    });

    expect(res.status).toBe(200);
    const dataUrl = await res.text();

    expect(dataUrl).toMatch(/bufo-blender-2000/);

    const outputBuffer = await fetch(dataUrl).then((res) => res.arrayBuffer());
    writeFileSync(
      path.resolve(__dirname, "./test-output.png"),
      Buffer.from(outputBuffer),
    );
  });
});
