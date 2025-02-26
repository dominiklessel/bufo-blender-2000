"use client";

import { useState, useRef, useEffect } from "react";
import { useLocalStorage } from "@uidotdev/usehooks";

import { motion, AnimatePresence } from "motion/react";
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
import { RGB, RGBToHSL } from "@/lib/colors";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { PlusIcon, MinusIcon, RotateCcwIcon, CogIcon } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import type React from "react";
import { type WebEmojiMetadata } from "@/lib/common";
import { Slider } from "@/components/ui/slider";

export default function BufoMosaic() {
  const [imageDataURL, setImageDataURL] = useState<string | null>(null);
  const [resizedImageDataURL, setResizedImageDataURL] = useState<string | null>(
    null,
  );
  const [mosaicDataURL, setMosaicDataURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [hasTransparency, setHasTransparency] = useState(false);

  const [targetSize, setTargetSize] = useLocalStorage("bufo-target-size", 4096);
  const [emojiSpacing, setEmojiSpacing] = useLocalStorage(
    "bufo-emoji-density",
    24,
  );
  const [emojiSize, setEmojiSize] = useLocalStorage("bufo-emoji-size", 64);
  const [useRgbMatching, setUseRgbMatching] = useLocalStorage(
    "bufo-use-rgb-matching",
    false,
  );

  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resizeCanvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    // Clear the previous mosaic and aspect ratio
    setMosaicDataURL(null);
    setResizedImageDataURL(null);
    setAspectRatio(null);
    setLoading(true);
    // Store filename without extension
    setFileName(file.name.replace(/\.[^/.]+$/, ""));

    // Check if file might have transparency
    const fileType = file.type.toLowerCase();
    setHasTransparency(
      fileType.includes("png") ||
        fileType.includes("svg") ||
        fileType.includes("webp"),
    );

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

  // Create a resized version of the input image to match mosaic dimensions
  const resizeInputImage = (
    originalImg: HTMLImageElement,
    width: number,
    height: number,
  ) => {
    if (!resizeCanvasRef.current) return;

    const canvas = resizeCanvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, width, height);

    // Draw the original image resized to match the mosaic dimensions
    ctx.drawImage(originalImg, 0, 0, width, height);

    // Get the resized image data URL with proper format to preserve transparency
    const format = hasTransparency ? "image/png" : "image/jpeg";
    setResizedImageDataURL(canvas.toDataURL(format));
  };

  useEffect(() => {
    if (imageDataURL && canvasRef.current && aspectRatio) {
      // Wait for animation to complete
      setTimeout(() => {
        setLoading(true);
        const img = new Image();
        img.onload = () => {
          // Calculate dimensions to maintain aspect ratio
          let width, height;
          if (aspectRatio > 1) {
            width = targetSize;
            height = targetSize / aspectRatio;
          } else {
            height = targetSize;
            width = targetSize * aspectRatio;
          }

          // Create a resized version of the input image
          resizeInputImage(img, width, height);

          createMosaic(img).then(() => {
            // Use PNG format for transparent images, JPEG for others
            const format = hasTransparency ? "image/png" : "image/jpeg";
            setMosaicDataURL(canvasRef.current!.toDataURL(format) || null);
            setLoading(false);
          });
        };
        img.src = imageDataURL;
      }, 150); // Match the animation duration
    }
  }, [imageDataURL, aspectRatio, hasTransparency]);

  const createMosaic = async (img: HTMLImageElement) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;
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

    // Clear canvas with transparent background instead of white fill
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw original image (for color sampling)
    ctx.drawImage(img, 0, 0, width, height);

    // Store the original image data
    const originalImageData = ctx.getImageData(0, 0, width, height);

    // Clear the canvas again for the mosaic
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const sampler = poissonDiscSampler(
      canvas.width,
      canvas.height,
      emojiSpacing, // Smaller = more emojis
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
        const a = originalImageData.data[pixelIndex + 3];

        // Skip fully transparent pixels
        if (a < 10) continue;

        const pixelRgb = { r, g, b };
        const closestEmoji = useRgbMatching
          ? findClosestEmojiRgb(pixelRgb)
          : findClosestEmojiHsl(pixelRgb);
        emojiPromises.push(drawEmoji(ctx, closestEmoji, x, y));
      }
    }

    await Promise.all(emojiPromises);
  };

  const findClosestEmojiHsl = (inputRgb: RGB): WebEmojiMetadata => {
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

  const findClosestEmojiRgb = (inputRgb: RGB): WebEmojiMetadata => {
    let closestEmoji = emojiMetadata[0];
    let minDistance = Number.POSITIVE_INFINITY;

    for (const emoji of emojiMetadata) {
      const { dominantRGB } = emoji;

      // Calculate Euclidean distance in RGB space
      // We can apply weights to different channels if needed
      const rWeight = 0.3; // Red contributes most to perceived brightness
      const gWeight = 0.59; // Green contributes most to perceived brightness
      const bWeight = 0.11; // Blue contributes least to perceived brightness

      const distance = Math.sqrt(
        rWeight * ((inputRgb.r - dominantRGB.r) / 255) ** 2 +
          gWeight * ((inputRgb.g - dominantRGB.g) / 255) ** 2 +
          bWeight * ((inputRgb.b - dominantRGB.b) / 255) ** 2,
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
        ? `bufo-blended-a-masterpiece-${fileName}.${hasTransparency ? "png" : "jpg"}`
        : `bufo-blended-a-masterpiece.${hasTransparency ? "png" : "jpg"}`;
      link.download = outputName;
      link.href = mosaicDataURL;
      link.click();
    }
  };

  return (
    <>
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
                        setResizedImageDataURL(null);
                        setAspectRatio(null);
                        setImageDataURL(null);
                        setShowComparison(false);
                        setHasTransparency(false);
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

            {/* Hidden canvas for resizing the input image */}
            <canvas ref={resizeCanvasRef} className="hidden" />

            <AnimatePresence>
              {(imageDataURL || loading) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full min-h-[300px] flex items-center justify-center rounded-lg border overflow-hidden"
                  style={{
                    background: hasTransparency
                      ? "repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 50% / 20px 20px"
                      : "white",
                  }}
                >
                  {imageDataURL && mosaicDataURL ? (
                    showComparison ? (
                      <BeforeAfterSlider
                        beforeImage={resizedImageDataURL || imageDataURL}
                        afterImage={mosaicDataURL}
                        className="overflow-hidden"
                      />
                    ) : (
                      <TransformWrapper
                        initialScale={1}
                        minScale={0.5}
                        maxScale={4}
                        centerOnInit={true}
                        wheel={{ step: 0.1 }}
                        doubleClick={{ mode: "reset" }}
                      >
                        {({ zoomIn, zoomOut, resetTransform }) => (
                          <>
                            <div className="absolute top-2 right-2 z-10 flex gap-1 bg-white/80 p-1 rounded-lg shadow-sm">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => zoomIn()}
                              >
                                <PlusIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => zoomOut()}
                              >
                                <MinusIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => resetTransform()}
                              >
                                <RotateCcwIcon className="h-4 w-4" />
                              </Button>
                            </div>
                            <TransformComponent
                              wrapperClass="w-full h-full"
                              contentClass="w-full h-full"
                            >
                              <img
                                src={mosaicDataURL}
                                alt="Mosaic"
                                className="w-full"
                              />
                            </TransformComponent>
                          </>
                        )}
                      </TransformWrapper>
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
      <Sheet>
        <SheetTrigger asChild>
          <Button className="fixed bottom-4 right-4 p-2" variant="outline">
            <CogIcon className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Processing Options</SheetTitle>
            <SheetDescription>
              Tell Bufo how you want to process your image. Settings are written
              to local storage.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0" htmlFor="target-size">
                Target size
              </Label>
              <Slider
                id="target-size"
                value={[targetSize]}
                min={1024}
                max={8192}
                step={128}
                onValueChange={(value) => setTargetSize(value[0])}
              />
              <div className="text-sm font-mono text-muted-foreground">
                {targetSize.toString().padStart(3, "0")}px
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0" htmlFor="emoji-size">
                Emoji size
              </Label>
              <Slider
                id="emoji-size"
                value={[emojiSize]}
                min={16}
                max={64}
                step={8}
                onValueChange={(value) => setEmojiSize(value[0])}
              />
              <div className="text-sm font-mono text-muted-foreground">
                {emojiSize.toString().padStart(3, "0")}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0" htmlFor="emoji-spacing">
                Emoji spacing
              </Label>
              <Slider
                id="emoji-spacing"
                value={[emojiSpacing]}
                min={8}
                max={128}
                step={8}
                onValueChange={(value) => setEmojiSpacing(value[0])}
              />
              <div className="text-sm font-mono text-muted-foreground">
                {emojiSpacing.toString().padStart(3, "0")}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="rgb-mode" className="w-[100px] shrink-0">
                RGB matching
              </Label>
              <Switch
                id="rgb-mode"
                checked={useRgbMatching}
                onCheckedChange={setUseRgbMatching}
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setTargetSize(4096);
                  setEmojiSize(64);
                  setEmojiSpacing(24);
                  setUseRgbMatching(false);
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
