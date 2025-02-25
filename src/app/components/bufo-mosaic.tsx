"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { poissonDiscSampler } from "@/lib/poisson-disc-sampler";
import { emojiMetadata } from "@/app/data/emoji-metadata";
import { Card, CardContent } from "@/components/ui/card";
import { BeforeAfterSlider } from "./before-after-slider";
import NextImage from "next/image";
import { cn } from "@/lib/utils";
import { type WebEmojiMetadata } from "@/lib/common";
import { RGB, RGBToHSL } from "@/lib/colors";

export default function BufoMosaic() {
  const [imageDataURL, setImageDataURL] = useState<string | null>(null);
  const [mosaicDataURL, setMosaicDataURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const [targetSize, setTargetSize] = useState(4096);
  const [emojiDensity, setEmojiDensity] = useState(32);
  const [emojiSize, setEmojiSize] = useState(64);

  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    // Clear the previous mosaic and aspect ratio
    setMosaicDataURL(null);
    setAspectRatio(null);
    setLoading(true);
    // Store filename without extension
    setFileName(file.name.replace(/\.[^/.]+$/, ""));

    const reader = new FileReader();
    reader.onloadend = () => {
      // Get aspect ratio before setting the image URL
      const img = new Image();
      img.onload = () => {
        setAspectRatio(img.width / img.height);
        setImageDataURL(reader.result as string);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  };

  useEffect(() => {
    if (imageDataURL && canvasRef.current && aspectRatio) {
      // Wait for animation to complete
      setTimeout(() => {
        setLoading(true);
        const img = new Image();
        img.onload = () => {
          createMosaic(img).then(() => {
            setMosaicDataURL(
              canvasRef.current!.toDataURL("image/jpeg") || null,
            );
            setLoading(false);
          });
        };
        img.src = imageDataURL;
      }, 150); // Match the animation duration
    }
  }, [imageDataURL, aspectRatio]);

  const createMosaic = async (img: HTMLImageElement) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const aspectRatio = img.width / img.height;

    // Calculate dimensions to maintain aspect ratio within 2048x2048
    let width, height;
    if (aspectRatio > 1) {
      width = targetSize;
      height = targetSize / aspectRatio;
    } else {
      height = targetSize;
      width = targetSize * aspectRatio;
    }

    canvas.width = width;
    canvas.height = height;

    // Draw background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw original image (for color sampling)
    ctx.drawImage(img, 0, 0, width, height);

    // Store the original image data
    const originalImageData = ctx.getImageData(0, 0, width, height);

    // Clear the canvas again for the mosaic
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sampler = poissonDiscSampler(
      canvas.width,
      canvas.height,
      emojiDensity, // Smaller = more emojis
    );
    let sample: number[] | undefined;
    const emojiPromises: Promise<void>[] = [];

    while ((sample = sampler())) {
      const [x, y] = sample;
      const imageX = Math.floor(x);
      const imageY = Math.floor(y);

      if (
        imageX >= 0 &&
        imageX < originalImageData.width &&
        imageY >= 0 &&
        imageY < originalImageData.height
      ) {
        const pixelIndex = (imageY * originalImageData.width + imageX) * 4;
        const r = originalImageData.data[pixelIndex];
        const g = originalImageData.data[pixelIndex + 1];
        const b = originalImageData.data[pixelIndex + 2];

        const closestEmoji = findClosestEmoji({ r, g, b });
        emojiPromises.push(drawEmoji(ctx, closestEmoji, x, y));
      }
    }

    await Promise.all(emojiPromises);
  };

  const findClosestEmoji = (inputRgb: RGB): WebEmojiMetadata => {
    const inputHSL = RGBToHSL(inputRgb);
    let closestEmoji = emojiMetadata[0];
    let minDistance = Number.POSITIVE_INFINITY;

    for (const emoji of emojiMetadata) {
      const { dominantHSL } = emoji;

      // Calculate HSL distance with special handling for hue
      // Hue is circular (0° and 360° are the same), so we need special calculation
      const hueDiff = Math.min(
        Math.abs(inputHSL.h - dominantHSL.h),
        360 - Math.abs(inputHSL.h - dominantHSL.h),
      );

      // Weight the components (these weights can be adjusted)
      // Hue is most important, followed by saturation, then lightness
      const hueWeight = 1.0;
      const satWeight = 0.8;
      const lightWeight = 0.6;

      const distance = Math.sqrt(
        hueWeight * (hueDiff / 180) ** 2 +
          satWeight * ((inputHSL.s - dominantHSL.s) / 100) ** 2 +
          lightWeight * ((inputHSL.l - dominantHSL.l) / 100) ** 2,
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestEmoji = emoji;
      }
    }

    return closestEmoji;
  };

  const drawEmoji = (
    ctx: CanvasRenderingContext2D,
    emoji: WebEmojiMetadata,
    x: number,
    y: number,
  ): Promise<void> => {
    return new Promise((resolve) => {
      const emojiImg = new Image();
      emojiImg.crossOrigin = "anonymous";
      emojiImg.onload = () => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.random() * Math.PI * 2);
        ctx.drawImage(
          emojiImg,
          -emojiSize / 2,
          -emojiSize / 2,
          emojiSize,
          emojiSize,
        );
        ctx.restore();
        resolve();
      };
      emojiImg.src = emoji.sourceUrl;
    });
  };

  const handleSave = () => {
    if (mosaicDataURL) {
      const link = document.createElement("a");
      const outputName = fileName
        ? `bufo-blended-a-masterpiece-${fileName}.jpg`
        : "bufo-blended-a-masterpiece.jpg";
      link.download = outputName;
      link.href = mosaicDataURL;
      link.click();
    }
  };

  return (
    <Card className="max-w-2xl mx-4 md:mx-auto mb-4">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              "w-full",
              !mosaicDataURL && !loading ? "h-[120px]" : "h-[40px]",
            )}
          >
            <AnimatePresence mode="wait">
              {!mosaicDataURL && !loading ? (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.15 }}
                  className="w-full h-full"
                >
                  <div
                    className={cn(
                      "w-full h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors",
                      isDragging
                        ? "border-primary bg-primary/10"
                        : "border-forest-700/25 hover:border-forest-700/50",
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2 text-forest-700">
                      <NextImage
                        src="/all-the-bufo/bufo-please.png"
                        alt="Bufo Artist Logo"
                        width={24}
                        height={24}
                        unoptimized
                      />
                      <p className="text-sm">
                        Drag and drop an image here, or click to select
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : mosaicDataURL && !loading ? (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.15 }}
                  className="flex w-full items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Button onClick={handleSave}>Download Masterpiece</Button>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="comparison-mode"
                        checked={showComparison}
                        onCheckedChange={setShowComparison}
                      />
                      <Label htmlFor="comparison-mode">Comparison mode</Label>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMosaicDataURL(null);
                      setAspectRatio(null);
                      setImageDataURL(null);
                      setShowComparison(false);
                    }}
                  >
                    Start Fresh
                  </Button>
                </motion.div>
              ) : null}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.15 }}
                  className="w-full h-full"
                >
                  <div className="flex items-center justify-center">
                    <NextImage
                      src="/bufo-loading.gif"
                      alt="Loading ..."
                      width={40}
                      height={40}
                      unoptimized
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {(imageDataURL || loading) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="relative w-full min-h-[300px] flex items-center justify-center rounded-lg border overflow-hidden"
              >
                {imageDataURL && mosaicDataURL ? (
                  showComparison ? (
                    <BeforeAfterSlider
                      beforeImage={imageDataURL}
                      afterImage={mosaicDataURL}
                      className="overflow-hidden"
                    />
                  ) : (
                    <img src={mosaicDataURL} alt="Mosaic" className="w-full" />
                  )
                ) : (
                  <motion.div
                    className="w-full relative"
                    animate={{
                      aspectRatio: aspectRatio ? `${aspectRatio}` : "16/9",
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full object-contain"
                    />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
