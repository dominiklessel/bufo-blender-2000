import Image from "next/image";
import BufoMosaic from "./components/bufo-mosaic";

export default function NewLayout() {
  return (
    <div>
      <div className="mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
            <Image
              src="/bufo-artist.png"
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
              src="/bufo-fine-art.png"
              alt="Bufo Fine Art"
              width={24}
              height={24}
              className="hidden md:block"
            />
          </div>
        </div>
      </div>
      <BufoMosaic />
      <div className="max-w-md mx-4 md:mx-auto mb-4">
        <p className="text-xs px-6 text-center text-forest-700/80">
          Bufo works its magic right here in your browser! No data leaves your
          device — it's just you and Bufo, creating masterpieces together.
        </p>
      </div>
    </div>
  );
}
