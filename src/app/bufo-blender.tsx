"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { motion } from "framer-motion";
import { Palette, ZoomIn, ZoomOut, RotateCcw, Info } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { processImageAction } from "./actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function BufoBlender() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [bufosPerRow, setBufosPerRow] = useState<number>(48);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSliderChange = useCallback((values: number[]) => {
    setBufosPerRow(values[0]);
    setIsDragging(true);
  }, []);

  const handleSliderEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Effect to reprocess image when bufosPerRow changes and dragging stops
  useEffect(() => {
    if (!isDragging && currentFile && !isProcessing) {
      const timeoutId = setTimeout(() => {
        processImage(currentFile);
      }, 250); // Wait 500ms after dragging stops before processing

      return () => clearTimeout(timeoutId);
    }
  }, [bufosPerRow, isDragging]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetState = useCallback(() => {
    setImageUrl(null);
    setProcessedImageUrl(null);
    setIsProcessing(false);
    setFileName(null);
    setCurrentFile(null);
    toast.info("Canvas cleared! Ready for your next masterpiece 🎨");
  }, []);

  const processImage = useCallback(
    async (file: File) => {
      try {
        if (file.size > 3 * 1024 * 1024) {
          toast.error("Image size should be less than 3MB");
          return;
        }

        // Store the current file for reprocessing
        setCurrentFile(file);

        // Reset processed image state before starting new processing
        setProcessedImageUrl(null);
        setIsProcessing(true);

        // Store the original file name without extension
        setFileName(file.name.replace(/\.[^/.]+$/, ""));

        const reader = new FileReader();
        reader.onload = () => {
          setImageUrl(reader.result as string);
        };
        reader.onerror = () => {
          toast.error("Failed to read the image file");
        };
        reader.readAsDataURL(file);

        // Create FormData and process the image
        const formData = new FormData();
        formData.append("image", file);
        formData.append("width", bufosPerRow.toString());

        const { imageUrl, error } = await processImageAction(formData);

        if (!imageUrl || error) {
          toast.error(error ?? "Failed to process the image");
          return;
        }

        setProcessedImageUrl(imageUrl);
        toast.success("Image processed successfully! 🐸");
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error(
          `Something went wrong while processing your image: ${
            error instanceof Error ? error.message : "Unknown error occurred"
          }`,
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [bufosPerRow],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) {
        toast.error("Please select an image file");
        return;
      }
      await processImage(file);
    },
    [processImage],
  );

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            await processImage(file);
            break;
          }
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [processImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    multiple: false,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Image
            src="/bufo-artist.png"
            alt="Bufo Artist Logo"
            width={80}
            height={80}
            className="rounded-full"
          />
          <h1 className="text-4xl font-bold text-forest">Bufo Blender 2000</h1>
        </div>
        <p className="text-lg text-forest/80">
          Transform your images into a ribbiting masterpiece! 🎨
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 min-h-[400px]">
        <Card
          {...getRootProps()}
          className={`relative flex h-full cursor-pointer flex-col items-center justify-center p-8 transition-colors ${
            isDragActive ? "border-forest" : "border-forest/20"
          }`}
        >
          <input {...getInputProps()} />
          <Palette className="mb-4 h-12 w-12 text-forest" />
          <p className="text-center text-forest/80">
            {isDragActive ? (
              "Drop your image here!"
            ) : (
              <span>
                Drag & drop an image, click to select,
                <br />
                or paste an image
              </span>
            )}
          </p>
          {imageUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-4 flex items-center justify-center"
            >
              <Image
                src={imageUrl || "/placeholder.svg"}
                alt="Original image"
                fill
                className="rounded-lg object-contain p-2 bg-white"
              />
            </motion.div>
          )}
        </Card>

        <Card className="relative flex h-full flex-col items-center justify-center p-8">
          <div className="absolute top-2 left-2 right-2 z-10 flex flex-col gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-lg">
            <div className="flex items-center gap-2">
              <label className="text-sm text-forest whitespace-nowrap flex items-center gap-1">
                BPR
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-forest/60" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-center">
                        <span className="font-bold">Bufos per Row</span>
                        <br />
                        Controls how many Bufos wide your image will be.
                        <br />
                        More Bufos = more detail but slower processing.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <Slider
                value={[bufosPerRow]}
                onValueChange={handleSliderChange}
                onValueCommit={handleSliderEnd}
                min={20}
                max={100}
                step={1}
                className="w-full"
              />
              <span className="text-sm text-forest min-w-[3ch]">
                {bufosPerRow}
              </span>
            </div>
          </div>
          {processedImageUrl ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative h-full w-full"
            >
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit={true}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute top-2 right-2 z-10 flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => zoomIn()}
                        className="bg-white/80 backdrop-blur-sm"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => zoomOut()}
                        className="bg-white/80 backdrop-blur-sm"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => resetTransform()}
                        className="bg-white/80 backdrop-blur-sm"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                    <TransformComponent
                      wrapperClass="!w-full !h-full"
                      contentClass="!w-full !h-full cursor-grab active:cursor-grabbing"
                    >
                      <div className="relative w-full h-full bg-white rounded-lg">
                        <img
                          src={processedImageUrl}
                          alt="Processed image"
                          className="object-contain p-2 select-none"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          draggable="false"
                        />
                      </div>
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </motion.div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center gap-4">
              <Image
                src="/bufo-offers-a-loading-spinner-spinning.gif"
                alt="Processing..."
                width={100}
                height={100}
              />
              <p className="text-center text-forest/80">
                Bufo is working its magic... 🪄
              </p>
            </div>
          ) : (
            <p className="text-center text-forest/60">
              Your Bufo masterpiece will appear here! 🐸
            </p>
          )}
          {processedImageUrl && (
            <CardFooter className="gap-2 p-0">
              <Button
                onClick={() => {
                  const link = document.createElement("a");
                  const outputName = fileName
                    ? `bufo-blended-${fileName}.png`
                    : "bufo-blended-a-masterpiece.png";
                  link.download = outputName;
                  link.href = processedImageUrl;
                  link.click();
                }}
                className="bg-forest text-cream hover:bg-forest/90"
              >
                Download Masterpiece
              </Button>
              <Button onClick={resetState} variant="outline">
                Start Fresh
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="absolute top-2 right-2 px-2">
            <Image
              src="/angry-karen-bufo-would-like-to-speak-with-your-manager.png"
              alt="Bufo would like to speak with your manager"
              width={24}
              height={24}
            />
            <span className="text-sm text-forest/80">
              Where does Bufo store my data?
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-forest/80">
              <Image
                src="/bufo-alarma.gif"
                alt="Bufo Artist Logo"
                width={24}
                height={24}
              />
              Bufo's Temporary Storage Pond
              <Image
                src="/bufo-alarma.gif"
                alt="Bufo Artist Logo"
                width={24}
                height={24}
              />
            </DialogTitle>
          </DialogHeader>
          <div className="text-forest/80">
            <p className="mt-2">
              Your masterpiece-in-progress takes a quick 10-minute lily pad rest
              in Bufo's secure pond (aka Amazon S3).
            </p>
            <ul className="list-disc list-inside mt-2">
              <li>All files hop away after 10 minutes – Bufo's orders!</li>
              <li>No public access – Bufo keeps your images private</li>
              <li>Bufo-approved pre-signed URLs for maximum security</li>
              <li>Best not to upload anything that would make Bufo blush</li>
            </ul>
            <p className="mt-2">
              By using Bufo Blender 2000, you acknowledge that while Bufo takes
              security very seriously, even the most vigilant amphibian can't
              guarantee 100% protection during temporary processing.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
