import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import BufoMosaic from "./components/bufo-mosaic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function NewLayout() {
  return (
    <div>
      <div className="mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
            <Image
              src="/all-the-bufo/bufo-artist.png"
              alt="Bufo Artist Logo"
              width={80}
              height={80}
              className="rounded-full border border-forest-700 bg-forest-700/20"
            />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-t from-forest-700 to-forest-600 font-lilita uppercase">
              Bufo Blender 2000
            </h1>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-1">
            <p className="text-xl font-anek">
              Transform your images into a ribbiting masterpiece!
            </p>
            <Image
              src="/all-the-bufo/bufo-fine-art.png"
              alt="Bufo Artist Logo"
              width={24}
              height={24}
              className="hidden md:block"
            />
          </div>
        </div>
      </div>
      <BufoMosaic />
      <div className="max-w-2xl mx-4 md:mx-auto mb-4 flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Image
                src="/all-the-bufo/angry-karen-bufo-would-like-to-speak-with-your-manager.png"
                alt="Bufo would like to speak with your manager"
                width={24}
                height={24}
              />
              <span className="text-sm text-forest/80">
                Where does Bufo store my data?
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-forest/80">
                <Image
                  src="/all-the-bufo/bufo-brings-magic-to-the-riot.gif"
                  alt="Bufo Artist Logo"
                  width={24}
                  height={24}
                  unoptimized
                />
                Bufo's Image Processing Magic
                <Image
                  src="/all-the-bufo/bufo-brings-magic-to-the-riot.gif"
                  alt="Bufo Artist Logo"
                  width={24}
                  height={24}
                  unoptimized
                />
              </DialogTitle>
            </DialogHeader>
            <div className="text-forest/80">
              <p className="mt-2">
                Bufo works his magic right here in your browser!
              </p>
              <ul className="list-disc list-inside mt-2">
                <li>
                  No file uploads needed – everything happens on your device
                </li>
                <li>Your images never leave your lily pad</li>
                <li>Bufo respects your privacy and doesn't store any data</li>
                <li>Just you and Bufo, creating masterpieces together</li>
              </ul>
              <p className="mt-2">Ribbiting locally with Bufo! 🌿</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
