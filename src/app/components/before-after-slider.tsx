"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  className,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const x = "touches" in event ? event.touches[0].clientX : event.clientX;
      const position = ((x - containerRect.left) / containerRect.width) * 100;

      setSliderPosition(Math.min(Math.max(position, 0), 100));
    },
    [isDragging],
  );

  const handleMouseDown = () => setIsDragging(true);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("touchmove", handleMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={cn("relative select-none touch-none", className)}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      <div className="relative w-full overflow-hidden">
        {/* Before Image */}
        <img
          src={beforeImage || "/placeholder.svg"}
          alt="Before"
          className="w-full object-cover"
          draggable="false"
        />

        {/* After Image */}
        <img
          src={afterImage || "/placeholder.svg"}
          alt="After"
          className="absolute top-0 left-0 w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          draggable="false"
        />

        {/* Slider */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-forest-700 flex items-center justify-center text-white">
              ⇄
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
